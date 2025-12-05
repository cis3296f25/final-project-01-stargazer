# stargazer.py
# Flask API + Skyfield core logic for planet visibility
# Run:  pip install flask skyfield
# Start:  python stargazer.py
# Try:  http://127.0.0.1:5000/visible?lat=39.981&lon=-75.155&twilight=nautical

import os
from datetime import datetime, timezone
from typing import Dict, List

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

from skyfield.data import hipparcos
from skyfield.api import (
    Loader,
    wgs84,
    Star,
    load_constellation_map,
    load_constellation_names,
    position_of_radec,
)

# -------------------------------------------------------------------
# Skyfield setup
# -------------------------------------------------------------------

load = Loader('~/skyfield-data')
ts = load.timescale()
eph = load('de440s.bsp')

EARTH = eph['earth']
SUN = eph['sun']
MOON = eph['moon']

PLANETS = {
    'Mercury': eph['mercury barycenter'],
    'Venus':   eph['venus barycenter'],
    'Mars':    eph['mars barycenter'],
    'Jupiter': eph['jupiter barycenter'],
    'Saturn':  eph['saturn barycenter'],
    'Uranus':  eph['uranus barycenter'],
    'Neptune': eph['neptune barycenter'],
}

# Load bright stars from the Hipparcos catalog
with load.open(hipparcos.URL) as f:
    HIP_STARS = hipparcos.load_dataframe(f)

# Limit to reasonably bright stars
BRIGHT_STARS = HIP_STARS[HIP_STARS['magnitude'] <= 3.5]

# Preload constellation lookup
CONSTELLATION_AT = load_constellation_map()
CONSTELLATION_NAMES = dict(load_constellation_names())

TWILIGHT_CUTOFFS = {
    'civil': -6.0,
    'nautical': -12.0,
    'astronomical': -18.0,
}

# -------------------------------------------------------------------
# Tiles path (for light pollution overlay)
# -------------------------------------------------------------------

BASE_DIR = os.path.dirname(__file__)
TILE_DIR = os.path.join(BASE_DIR, "tiles")


def alt_az_simple(body, observer, t):
    alt, az, _ = observer.at(t).observe(body).apparent().altaz()
    return alt.degrees, az.degrees


def moon_phase_fraction(t) -> float:
    from math import cos
    e = EARTH.at(t)
    sun, moon = e.observe(SUN).apparent(), e.observe(MOON).apparent()
    phase_angle = moon.separation_from(sun).radians
    # 0 = new, 1 = full
    return (1 - cos(phase_angle)) / 2.0


def visible_constellations_for(
    observer,
    t,
    dark_enough: bool,
    mag_limit: float = 3.0,
) -> List[Dict]:
    # No constellations if not dark enough
    if not dark_enough:
        return []

    # Filter by mag limit (lower magnitude = brighter star)
    stars = BRIGHT_STARS[BRIGHT_STARS['magnitude'] <= mag_limit]

    # Build Star vector
    star_vector = Star.from_dataframe(stars)

    # Compute positions
    astrometric = observer.at(t).observe(star_vector)
    apparent = astrometric.apparent()

    alt, az, _ = apparent.altaz()
    ra, dec, _ = apparent.radec()

    alt_deg = alt.degrees
    az_deg = az.degrees

    visible_mask = alt_deg > 0
    if not visible_mask.any():
        return []

    visible_stars = stars[visible_mask]
    vis_alt = alt_deg[visible_mask]
    vis_az = az_deg[visible_mask]
    vis_ra_hours = ra.hours[visible_mask]
    vis_dec_deg = dec.degrees[visible_mask]

    constellations_map = {}

    for (hip_id, star_row), alt_d, az_d, ra_h, dec_d in zip(
        visible_stars.iterrows(), vis_alt, vis_az, vis_ra_hours, vis_dec_deg
    ):
        pos = position_of_radec(ra_h, dec_d)
        const_abbr = CONSTELLATION_AT(pos)
        const_name = CONSTELLATION_NAMES.get(const_abbr, const_abbr)
        mag = star_row['magnitude']

        if (
            const_abbr not in constellations_map
            or mag < constellations_map[const_abbr]['magnitude']
        ):
            constellations_map[const_abbr] = {
                'id': const_abbr.lower(),
                'name': const_name,
                'abbreviation': const_abbr,
                'magnitude': mag,
                'altitude_deg': round(float(alt_d), 2),
                'azimuth_deg': round(float(az_d), 2),
            }

    visible_constellations = sorted(
        constellations_map.values(),
        key=lambda c: -c['altitude_deg'],
    )

    return visible_constellations


def visible_planets(
    lat: float,
    lon: float,
    elevation_m: float,
    when_utc: datetime,
    twilight: str,
) -> Dict:
    t = ts.from_datetime(when_utc)
    observer = EARTH + wgs84.latlon(
        latitude_degrees=lat,
        longitude_degrees=lon,
        elevation_m=elevation_m,
    )

    sun_alt_deg, _ = alt_az_simple(SUN, observer, t)
    cutoff = TWILIGHT_CUTOFFS.get(twilight, -18.0)
    dark_enough = sun_alt_deg <= cutoff

    results: List[Dict] = []
    for name, body in PLANETS.items():
        alt_deg, az_deg = alt_az_simple(body, observer, t)
        if alt_deg > 0 and dark_enough:
            results.append({
                'name': name,
                'altitude_deg': round(alt_deg, 2),
                'azimuth_deg': round(az_deg, 2),
            })

    moon_alt_deg, moon_az_deg = alt_az_simple(MOON, observer, t)
    moon_illum = moon_phase_fraction(t)

    visible_constellations = visible_constellations_for(observer, t, dark_enough)

    return {
        'when_utc': when_utc.isoformat(),
        'location': {'lat': lat, 'lon': lon, 'elevation_m': elevation_m},
        'twilight': twilight,
        'sun_altitude_deg': round(sun_alt_deg, 2),
        'visible_planets': sorted(results, key=lambda r: -r['altitude_deg']),
        'moon': {
            'altitude_deg': round(moon_alt_deg, 2),
            'azimuth_deg': round(moon_az_deg, 2),
            'illumination_fraction': round(moon_illum, 3),
        },
        'constellations': visible_constellations,
    }


app = Flask(__name__)
CORS(app)


@app.get("/visible")
def api_visible():
    try:
        lat = float(request.args.get("lat"))
        lon = float(request.args.get("lon"))
    except (TypeError, ValueError):
        return jsonify(error="lat and lon are required and must be numbers"), 400

    elev = float(request.args.get("elev", 0))
    twilight = request.args.get("twilight", "astronomical").lower()
    t_str = request.args.get("time")

    if t_str:
        when_utc = datetime.fromisoformat(
            t_str.replace("Z", "+00:00")
        ).astimezone(timezone.utc)
    else:
        when_utc = datetime.now(timezone.utc)

    data = visible_planets(lat, lon, elev, when_utc, twilight)
    return jsonify(data)


@app.route("/tiles/<int:z>/<int:x>/<int:y>.png")
def get_tile(z, x, y):
    """
    Serve pre-generated PNG tiles from backend/tiles/z/x/y.png
    """
    # Directory: tiles/z/x/, file: y.png
    dirpath = os.path.join(TILE_DIR, str(z), str(x))
    filename = f"{y}.png"

    full_path = os.path.join(dirpath, filename)
    if not os.path.exists(full_path):
        return "Tile not found", 404

    return send_from_directory(dirpath, filename, mimetype="image/png")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
