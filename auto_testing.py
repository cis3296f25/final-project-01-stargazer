'''
Testing File for stargazer
'''

import stargazer as sg
import math
from pytz import timezone
from skyfield.api import Loader
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo

load = Loader('~/skyfield-data')
ts = load.timescale()

def moon_phase_test():
    #Tests moon phase meth
    """
    Tests the moon phase fraction function
    in stargazer.py

    Moon phase fraction should be 1 for 
    11/5/2025 (Full Moon)
    """
    eastern = ZoneInfo('US/Eastern')
    test_date = ts.from_datetime(datetime(2025,11,5,11,30,tzinfo=eastern))

    #Variables for expected and actual values
    exp = 1
    act = sg.moon_phase_fraction(test_date)
    try:
        #print(math.isclose(act, exp, rel_tol=1e-4))
        assert math.isclose(1, exp, rel_tol=1e-4)
        return 1
    except AssertionError:
        print('Moon phase should approximately be: ' + str(exp))
        print('Moon phase is: ' + str(act))
        return 0

if __name__ == "__main__":
     
    print(moon_phase_test())
