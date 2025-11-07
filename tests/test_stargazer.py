'''
Testing File for stargazer
'''

#to run tests, type pytest -v in the terminal while in the root directory

#To run tests with coverage, install pytest-cov (pip install pytest-cov)
#run pytest --cov=stargazer --cov-report=term-missing
    #--cov=stargazer specifies the module to measure coverage for
    #--cov-report=term-missing shows which lines were not covered in the terminal
    #--cov-report=html can be used to generate an HTML report instead

import stargazer as sg
import math
from pytz import timezone
from skyfield.api import Loader
from datetime import datetime, timezone as tz, timedelta
from zoneinfo import ZoneInfo

load = Loader('~/skyfield-data')
ts = load.timescale()

def test_moon_phase_fraction_fullish():
    """
    The Moon was (very close to) full on 2025-11-05.
    We assert illumination is high (~>=0.98), not exactly 1.0.
    """
    #use a local time in Eastern and convert with Skyfield in stargazer
    eastern = ZoneInfo("US/Eastern")
    approx_full_moon_local = datetime(2025, 11, 5, 23, 30, tzinfo=eastern)

    #skyfield expects a skyfield time object; reuse stargazer.ts
    t = sg.ts.from_datetime(approx_full_moon_local)

    illum = sg.moon_phase_fraction(t)
    assert 0.98 <= illum <= 1.0, f"Expected ~full moon, got {illum:.4f}"

def test_moon_phase_fraction_bounds():
    """
    Illumination fraction is always between 0 and 1.
    """
    t = sg.ts.from_datetime(datetime(2025, 1, 1, tzinfo=tz.utc))
    illum = sg.moon_phase_fraction(t)
    assert 0.0 <= illum <= 1.0

def test_visible_planets_daytime_empty_when_not_dark():
    """
    During bright daytime, dark_enough=False, so visible_planets list should be empty
    by current logic (requires both alt>0 and dark_enough).
    """
    lat, lon, elev = 39.981, -75.155, 0  # Philly-ish
    when = datetime(2025, 7, 1, 16, 0, tzinfo=tz.utc)  # broad daylight in summer
    data = sg.visible_planets(lat, lon, elev, when, twilight="astronomical")
    assert isinstance(data["visible_planets"], list)
    assert data["sun_altitude_deg"] > -18.0  # not dark
    assert len(data["visible_planets"]) == 0

def test_moon_fraction_new():
    """
    Last new moon occured on October 21, 2025 at 8:25 AM
    Illumination should be near at its lowest ~.2
    """
    eastern = ZoneInfo("US/Eastern")
    approx_new_moon_local = datetime(2025, 10, 21, 8, 25, tzinfo=eastern)

    t = sg.ts.from_datetime(approx_new_moon_local)

    illum = sg.moon_phase_fraction(t)
    assert 0.0 <= illum <= .20, f"Expected ~full moon, got {illum:.4f}"


def test_alt_az_in_range():
    """
    Altitude should be in range: -90.0 <= altitude <= 90.0'
    Azimuth should be in range: 0 <= azimuth <= 360.0
    """
    t = sg.ts.from_datetime(datetime.now(tz.utc))
    observer = sg.EARTH + sg.wgs84.latlon(39.981, -75.155)

    alt,az = sg.alt_az_simple(sg.SUN, observer, t)

    assert isinstance(alt,float)
    assert isinstance(az,float)
    assert -90.0 <= alt <= 90.0
    assert 0 <= az <= 360.0
#deprecated test. already covered by test_moon_phase_fraction_fullish and test_moon_phase_fraction_bounds

# def test_moon_phase():
#     #Tests moon phase math
#     """
#     Tests the moon phase fraction function
#     in stargazer.py

#     Moon phase fraction should be 1 for 
#     11/5/2025 (Full Moon)
#     """
#     eastern = ZoneInfo('US/Eastern')
#     test_date = ts.from_datetime(datetime(2025,11,5,11,30,tzinfo=eastern))

#     #Variables for expected and actual values
#     exp = 1
#     act = sg.moon_phase_fraction(test_date)
#     try:
#         #print(math.isclose(act, exp, rel_tol=1e-4))
#         assert math.isclose(1, exp, rel_tol=1e-4)
#         return 1
#     except AssertionError:
#         print('Moon phase should approximately be: ' + str(exp))
#         print('Moon phase is: ' + str(act))
#         return 0
