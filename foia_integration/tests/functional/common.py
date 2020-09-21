"""Common utilities for use solely in functional tests."""
import os
from urllib.parse import urljoin, urlsplit, parse_qs

from django.urls import reverse
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# This is a convenience list of all urls that users can visit
URL_NAMES = ["index", "template", "foia-request"]

# This is a convenience list of all URLS that require *Google* Authentication
REQUIRES_GOOGLE = ["template", "foia-request"]


def get_urls(base_url, url_names):
    """Returns a list of URLS and their relative paths.

    Takes the name of the url (e.g. 'index') and the starting url (e.g. localhost:8000).

    Args:
        base_url: The starting URL (e.g. localhost)
        url_names: A list of names of URL deciphered by django's url reverse
            (e.g. REQUIRES_GOOGLE)

    Returns:
        A list of tuples of (relative path from base URL, full URL)
    """
    rel_paths = [reverse(name) for name in url_names]
    all_urls = [urljoin(base_url, name) for name in rel_paths]
    return list(zip(rel_paths, all_urls))


def login_google(browser, go_home=True):
    """Logs in through your Google account (given you're at a given website).

    Args:
        browser: selenium browser
        go_home: True if you want to go back to the starting page on successful log in.
    """
    if any(
        [
            os.environ.get(key) is None
            for key in ["TEST_GMAIL_USER", "TEST_GMAIL_PASSWORD"]
        ]
    ):
        import dotenv

        dotenv.load_dotenv()
    start_url = browser.current_url
    # startswith selector allows for handling of redirects
    # (e.g. django's login_required, which has ?next=)
    browser.find_element_by_xpath(
        "//*[starts-with(@href,'/accountsgoogle/login/')]"
    ).click()
    browser.find_element_by_id("identifierId").send_keys(os.environ["TEST_GMAIL_USER"])
    browser.find_element_by_id("identifierId").send_keys(Keys.ENTER)
    password_field = WebDriverWait(browser, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//*[@aria-label='Enter your password']"))
    )
    password_field.send_keys(os.environ["TEST_GMAIL_PASSWORD"])
    password_field.send_keys(Keys.ENTER)
    # HACK: Adding sleep is currently necessary *I think* because I haven't built
    # the template for the user profile. Once I build that, I should remove this.
    if go_home:
        import time

        time.sleep(2)
        browser.get(start_url)


def check_redirect(test_client, url, rel_path, end_url):
    """Convenience metric for two redirect tests.

    Makes sure directs go to the end_url and then to the rel_path.

    Args:
        test_client: A Django test client instance
        url: the full URL you want to redirect from
        rel_path: the relative path to the url
        end_url: the relative path (from the base url) you want the redirect
            to go to (e.g. '/' for home)

    Raises:
        AssertionError if the url does not redirect,
            if the client redirects but not to the end_url,
            if the redirection doesn't point to a 'next' query parameter,
            or if the 'next' parameter isn't the starting url
    """
    response = test_client.get(url, follow=True)
    assert len(response.redirect_chain) >= 1
    last_url = response.redirect_chain[-1][0]
    parsed_url = urlsplit(last_url)
    # This makes
    assert parsed_url.path == end_url
    redirect = parse_qs(parsed_url.query).get("next")
    assert redirect is not None
    assert rel_path == redirect[0]
