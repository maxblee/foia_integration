"""Tests the accessibility of web pages across the FOIA site
(does not include tests for django admin though tbh it probably should)
"""
import datetime
import pathlib

from axe_selenium_python import Axe

from tests.functional.common import URL_NAMES, get_urls, login_google

AXE_REPORTS = pathlib.Path("reports/axe")


def test_axe_a11y(selenium, live_server, base_db):
    """Run generic accessibility tests, making sure there are
    no obvious violations."""
    # first log into google so we can visit all the urls
    selenium.get(live_server.url)
    login_google(selenium)
    test_failed = False
    for count, (_, url) in enumerate(get_urls(live_server.url, URL_NAMES)):
        selenium.get(url)
        axe = Axe(selenium)
        axe.inject()
        results = axe.run()
        try:
            assert len(results["violations"]) == 0
        except AssertionError:
            current = datetime.datetime.now(datetime.timezone.utc)
            midnight = current.replace(hour=0, minute=0, second=0, microsecond=0)
            since_midnight = (current - midnight).seconds
            current_fmt = current.strftime("%Y%m%d")
            result_output = AXE_REPORTS / f"{current_fmt}-{since_midnight}-{count}.json"
            axe.write_results(results, result_output)
            test_failed = True
    assert not test_failed
