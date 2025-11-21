# stargazer.py
# Flask API + Skyfield core logic for planet visibility
# Run:  pip install flask skyfield
# Start:  python stargazer.py
# Try:  http://127.0.0.1:5000/visible?lat=39.981&lon=-75.155&twilight=nautical

from datetime import datetime, timezone
from typing import Dict, List
from flask import Flask, request, jsonify
from skyfield.data import hipparcos
from skyfield.api import Loader, wgs84, Star, load_constellation_map, load_constellation_names, position_of_radec
from flask_cors import CORS

from skyfield.api import Star


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

#load bright stars from the hipparcos catalog
with load.open(hipparcos.URL) as f:
    HIP_STARS = hipparcos.load_dataframe(f)

#limit to reasonably bright stars
BRIGHT_STARS = HIP_STARS[HIP_STARS['magnitude'] <= 3.5]

#preload constellation lookup function
CONSTELLATION_AT = load_constellation_map()
CONSTELLATION_NAMES = dict(load_constellation_names())

TWILIGHT_CUTOFFS = {
    'civil': -6.0,
    'nautical': -12.0,
    'astronomical': -18.0
}

def alt_az_simple(body, observer, t):
    alt, az, _ = observer.at(t).observe(body).apparent().altaz()
    return alt.degrees, az.degrees

def moon_phase_fraction(t) -> float:
    from math import cos
    e = EARTH.at(t)
    sun, moon = e.observe(SUN).apparent(), e.observe(MOON).apparent()
    phase_angle = moon.separation_from(sun).radians
    #return (1 + cos(phase_angle)) / 2.0 old
    return (1 - cos(phase_angle)) / 2.0 #new. moon phase fraction: 0=new, 1=full. full expects 1.0

#use bright stars to determine constellation visibility
#aggregate by constellation and keep the brightest visible star as a representative

def visible_constellations_for(observer, t, dark_enough: bool, mag_limit: float = 3.0) -> List[Dict]:
    #no constellations visible if not dark enough
    if not dark_enough:
        return []
    
    #filter for dynamically tweaking mag limit (lower magnitude = brighter star)
    stars = BRIGHT_STARS[BRIGHT_STARS['magnitude'] <= mag_limit]

    #build a list of star objects
    #converting DataFrame to Star vector
    star_vector = Star.from_dataframe(stars)

    #compute astrometric (geometric) positions of all stars as seen from the observer's location at time t
    astrometric = observer.at(t).observe(star_vector)
    #convert geometric position to apparent position (accounting for refraction etc.)
    apparent = astrometric.apparent()

    #get altitude (degrees above horizon) and azimuth (degrees from North)
    #also get RA/Dec for celestial coordinates
    alt, az, _ = apparent.altaz()
    ra, dec, _ = apparent.radec()

    #convert Skyfield angle objects to raw degree arrays
    alt_deg = alt.degrees
    az_deg = az.degrees

    #visible = above horizon
    visible_mask = alt_deg > 0

    if not visible_mask.any():
        return []
    
    #apply mask
    visible_stars = stars[visible_mask]
    vis_alt = alt_deg[visible_mask]
    vis_az = az_deg[visible_mask]
    vis_ra_hours = ra.hours[visible_mask]       #needed for skyfields constellation lookup
    vis_dec_deg = dec.degrees[visible_mask]

    constellations_map = {}

    #loop over each visible star and its computed alt/az and ra/dec
    for(hip_id, star_row), alt_d, az_d, ra_h, dec_d in zip(
        visible_stars.iterrows(), vis_alt, vis_az, vis_ra_hours, vis_dec_deg
    ):
        #build a position from RA/Dec so we can ask which constellation it's in
        pos = position_of_radec(ra_h, dec_d)

        #load_constellation_map() returns the constellation abbreviation (e.g., "Ori")
        const_abbr = CONSTELLATION_AT(pos)

        #map abbreviation -> full name (fallback to abbr if not found for some reason)
        const_name = CONSTELLATION_NAMES.get(const_abbr, const_abbr)

        mag = star_row['magnitude']

        #keep the brightest star (smallest magnitude) as representative
        if const_abbr not in constellations_map or mag < constellations_map[const_abbr]['magnitude']:
            constellations_map[const_abbr] = {
                'id': const_abbr.lower(),
                'name': const_name,
                'abbreviation': const_abbr,
                'magnitude': mag,
                'altitude_deg': round(float(alt_d), 2),
                'azimuth_deg': round(float(az_d), 2)
            }
    #convert map to list and sort by altitude (highest first)
    visible_constellations = sorted(
        constellations_map.values(),
        key=lambda c: -c['altitude_deg']
    )

    return visible_constellations


def visible_planets(lat: float, lon: float, elevation_m: float, when_utc: datetime, twilight: str) -> Dict:
    t = ts.from_datetime(when_utc)
    observer = EARTH + wgs84.latlon(latitude_degrees=lat, longitude_degrees=lon, elevation_m=elevation_m)

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
                'azimuth_deg': round(az_deg, 2)
            })

    moon_alt_deg, moon_az_deg = alt_az_simple(MOON, observer, t)
    moon_illum = moon_phase_fraction(t)

    # Calculate visible constellations
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
            'illumination_fraction': round(moon_illum, 3)
        },
        'constellations': visible_constellations
    }

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=False)

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
        when_utc = datetime.fromisoformat(t_str.replace("Z","+00:00")).astimezone(timezone.utc)
    else:
        when_utc = datetime.now(timezone.utc)

    data = visible_planets(lat, lon, elev, when_utc, twilight)
    return jsonify(data)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
