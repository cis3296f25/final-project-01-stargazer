"""
Testing File for stargazer
"""

# To run tests, type pytest -v in the terminal while in the root directory.
#
# To run tests with coverage, install pytest-cov (pip install pytest-cov)
# and run:
#   pytest --cov=stargazer --cov-report=term-missing
#   --cov=stargazer specifies the module to measure coverage for
#   --cov-report=term-missing shows which lines were not covered in the terminal
#   --cov-report=html can be used to generate an HTML report instead

import stargazer as sg
import math
from pytz import timezone
from skyfield.api import Loader
from datetime import datetime, timezone as tz, timedelta
from zoneinfo import ZoneInfo

from datetime import datetime, timezone
import pytest


def test_moon_phase_fraction_fullish():
    """
    The Moon was (very close to) full on 2025-11-05.
    We assert illumination is high (~>=0.98), not exactly 1.0.
    """
    # use a local time in Eastern and convert with Skyfield in stargazer
    eastern = ZoneInfo("US/Eastern")
    approx_full_moon_local = datetime(2025, 11, 5, 23, 30, tzinfo=eastern)

    # Skyfield expects a Skyfield time object; reuse stargazer.ts
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
    Last new moon occurred on October 21, 2025 at 8:25 AM.
    Illumination should be near its lowest (~<= 0.20).
    """
    eastern = ZoneInfo("US/Eastern")
    approx_new_moon_local = datetime(2025, 10, 21, 8, 25, tzinfo=eastern)

    t = sg.ts.from_datetime(approx_new_moon_local)

    illum = sg.moon_phase_fraction(t)
    assert 0.0 <= illum <= 0.20, f"Expected ~new moon, got {illum:.4f}"


def test_alt_az_in_range():
    """
    Altitude should be in range: -90.0 <= altitude <= 90.0
    Azimuth should be in range: 0 <= azimuth <= 360.0
    """
    t = sg.ts.from_datetime(datetime.now(tz.utc))
    observer = sg.EARTH + sg.wgs84.latlon(39.981, -75.155)

    alt, az = sg.alt_az_simple(sg.SUN, observer, t)

    assert isinstance(alt, float)
    assert isinstance(az, float)
    assert -90.0 <= alt <= 90.0
    assert 0 <= az <= 360.0


@pytest.fixture(scope="session")
def stargazer_module():
    """
    Return the real stargazer module.

    We no longer install a fake Skyfield; this allows constellations
    and other Skyfield-powered features to work as in the real app.
    """
    return sg


@pytest.fixture()
def app(stargazer_module):
    # Flask app from module
    stargazer_module.app.config.update(TESTING=True)
    return stargazer_module.app


@pytest.fixture()
def client(app):
    # creates a test client for fake web requests (e.g., GET /visible?lat=40&lon=-75)
    return app.test_client()


def _iso_utc(dt: datetime) -> str:
    # helper: returns a UTC datetime as a clean ISO string (YYYY-MM-DDTHH:MM:SSZ)
    return (
        dt.astimezone(timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )


def test_missing_lat_or_lon_returns_400(client):
    resp = client.get("/visible")
    assert resp.status_code == 400
    assert "lat and lon" in resp.get_json()["error"]

    resp = client.get("/visible?lat=39.98")
    assert resp.status_code == 400

    resp = client.get("/visible?lon=-75.16")
    assert resp.status_code == 400
    # testing if lat or lon is missing


def test_non_numeric_lat_lon_returns_400(client):
    assert client.get("/visible?lat=philly&lon=-75.16").status_code == 400
    assert client.get("/visible?lat=39.98&lon=west").status_code == 400
    # tests if sending a non-numeric value returns an error


def test_success_with_defaults_and_stub(monkeypatch, stargazer_module, client):
    captured = {}

    def fake_visible_planets(lat, lon, elev, when_utc, twilight):
        captured.update(dict(lat=lat, lon=lon, elev=elev, when_utc=when_utc, twilight=twilight))
        return {"visible_planets": [{"name": "Mars", "altitude_deg": 42.0}], "moon": {"illumination_fraction": 0.5}}

    # replace the heavy function with a small predictable stub
    monkeypatch.setattr(stargazer_module, "visible_planets", fake_visible_planets)

    resp = client.get("/visible?lat=39.98&lon=-75.16")
    assert resp.status_code == 200
    data = resp.get_json()
    assert "visible_planets" in data and data["visible_planets"][0]["name"] == "Mars"

    # check parsed defaults and types
    assert captured["lat"] == 39.98
    assert captured["lon"] == -75.16
    assert captured["elev"] == 0.0
    assert captured["twilight"] == "astronomical"
    assert captured["when_utc"].tzinfo == timezone.utc

    # tests a successful request


def test_elevation_twilight_time_parsing(monkeypatch, stargazer_module, client):
    seen = {}

    def fake_visible_planets(lat, lon, elev, when_utc, twilight):
        seen.update(dict(lat=lat, lon=lon, elev=elev, when_utc=when_utc, twilight=twilight))
        return {"ok": True}

    monkeypatch.setattr(stargazer_module, "visible_planets", fake_visible_planets)

    t = datetime(2025, 1, 2, 3, 4, 5, tzinfo=timezone.utc)
    qs = f"lat=40&lon=-75&elev=120.5&twilight=Nautical&time={_iso_utc(t)}"
    resp = client.get(f"/visible?{qs}")
    assert resp.status_code == 200
    assert resp.get_json() == {"ok": True}

    assert seen["lat"] == 40.0
    assert seen["lon"] == -75.0
    assert seen["elev"] == 120.5
    assert seen["twilight"] == "nautical"
    assert seen["when_utc"] == t


def test_time_with_explicit_offset_ok(monkeypatch, stargazer_module, client):
    def fake_visible_planets(lat, lon, elev, when_utc, twilight):
        assert when_utc == datetime(2025, 1, 2, 3, 4, 5, tzinfo=timezone.utc)
        return {"ok": True}

    monkeypatch.setattr(stargazer_module, "visible_planets", fake_visible_planets)

    resp = client.get(
        "/visible",
        query_string={"lat": 40, "lon": -75, "time": "2025-01-02T03:04:05+00:00"},
    )
    assert resp.status_code == 200
    assert resp.get_json()["ok"] is True


def test_bad_time_string_current_behavior(client):
    """
    Your current route does not catch bad 'time' strings, so Flask will 500.
    If you later add try/except around datetime parsing, change to assert 400.
    """
    with pytest.raises(ValueError):
        client.get("/visible", query_string={"lat": 40, "lon": -75, "time": "not-a-time"})
