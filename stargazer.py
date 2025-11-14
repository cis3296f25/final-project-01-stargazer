# stargazer.py
# Flask API + Skyfield core logic for planet visibility
# Run:  pip install flask skyfield
# Start:  python stargazer.py
# Try:  http://127.0.0.1:5000/visible?lat=39.981&lon=-75.155&twilight=nautical

from datetime import datetime, timezone, timedelta
from typing import Dict, List
from flask import Flask, request, jsonify
from skyfield.api import Loader, wgs84
from flask_cors import CORS


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

# Constellation data: approximate center declination and brightest star magnitude
CONSTELLATIONS = [
    {'id': 'ori', 'name': 'Orion', 'abbreviation': 'Ori', 'declination_deg': 5.0, 'magnitude': 2.0},
    {'id': 'uma', 'name': 'Ursa Major', 'abbreviation': 'UMa', 'declination_deg': 55.0, 'magnitude': 1.9},
    {'id': 'umi', 'name': 'Ursa Minor', 'abbreviation': 'UMi', 'declination_deg': 75.0, 'magnitude': 2.2},
    {'id': 'cas', 'name': 'Cassiopeia', 'abbreviation': 'Cas', 'declination_deg': 60.0, 'magnitude': 2.4},
    {'id': 'lyr', 'name': 'Lyra', 'abbreviation': 'Lyr', 'declination_deg': 38.0, 'magnitude': 0.0},
    {'id': 'cyg', 'name': 'Cygnus', 'abbreviation': 'Cyg', 'declination_deg': 45.0, 'magnitude': 1.3},
    {'id': 'sco', 'name': 'Scorpius', 'abbreviation': 'Sco', 'declination_deg': -25.0, 'magnitude': 1.6},
    {'id': 'leo', 'name': 'Leo', 'abbreviation': 'Leo', 'declination_deg': 15.0, 'magnitude': 1.4},
    {'id': 'vir', 'name': 'Virgo', 'abbreviation': 'Vir', 'declination_deg': -5.0, 'magnitude': 3.0},
    {'id': 'taur', 'name': 'Taurus', 'abbreviation': 'Tau', 'declination_deg': 15.0, 'magnitude': 1.5},
    {'id': 'and', 'name': 'Andromeda', 'abbreviation': 'And', 'declination_deg': 40.0, 'magnitude': 2.9},
    {'id': 'psa', 'name': 'Piscis Austrinus', 'abbreviation': 'PsA', 'declination_deg': -30.0, 'magnitude': 1.1}
]

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



def is_constellation_visible(declination_deg: float, observer_lat: float) -> bool:
    # A constellation is visible if its declination is within the observer's visible sky
    # Simplified: constellation is visible if it can rise above horizon
    # For northern hemisphere: declination > (90 - latitude) means circumpolar
    # For southern hemisphere: declination < -(90 - abs(latitude)) means circumpolar
    # For general case: if abs(declination - observer_lat) < 90, it can be visible
    return abs(declination_deg - observer_lat) < 90


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

    #Calculate visible constellations
    visible_constellations: List[Dict] = []
    # for const in CONSTELLATIONS:
    #     is_visible = is_constellation_visible(const['declination_deg'], lat) and dark_enough
    #     visible_constellations.append({
    #         'id': const['id'],
    #         'name': const['name'],
    #         'abbreviation': const['abbreviation'],
    #         'visible': is_visible,
    #         'magnitude': const['magnitude']
    #     })

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

CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}}, supports_credentials=False)

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


"""
# stargazer.py
# Flask API + Skyfield core logic for planet visibility
# Run:  pip install flask skyfield
# Start:  python stargazer.py
# Try:  http://127.0.0.1:5000/visible?lat=39.981&lon=-75.155&twilight=nautical

from datetime import datetime, timezone, timedelta
from typing import Dict, List
from flask import Flask, request, jsonify
from skyfield.api import Loader, wgs84
from flask_cors import CORS


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
        }
    }

app = Flask(__name__)

CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}}, supports_credentials=False)

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
"""