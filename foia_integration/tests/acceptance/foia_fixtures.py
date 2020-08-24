import os

# adapted from https://behave.readthedocs.io/en/latest/usecase_django.html
from behave import fixture
from django.core.management import call_command
from django.test.runner import DiscoverRunner
from django.test.testcases import LiveServerTestCase
from django.test import Client
from selenium import webdriver
from selenium.webdriver.common import action_chains
from allauth.socialaccount.models import SocialApp
from faker import Faker

CLIENT_ID = os.environ["GOOGLE_APP_CLIENT"]
CLIENT_SECRET = os.environ["GOOGLE_APP_SECRET"]

@fixture
def browser(context, browser_name="Firefox", timeout=30, **kwargs):
    # adapted from https://behave.readthedocs.io/en/latest/fixtures.html
    browser = getattr(webdriver, browser_name)()
    browser.implicitly_wait(2)
    context.browser = browser
    context.browser_actions = action_chains.ActionChains(context.browser)
    context.add_cleanup(browser.close)
    return browser

@fixture
def django_test_runner(context):
    context.fake = Faker()
    context.test_runner = DiscoverRunner()
    context.test_runner.setup_test_environment()
    context.old_db_config = context.test_runner.setup_databases()
    yield
    context.test_runner.teardown_databases(context.old_db_config)
    context.test_runner.teardown_test_environment()

@fixture
def django_test_case(context):
    context.test_case = setup_test_case(LiveServerTestCase)
    # initially set browser to None and override on fixture.browser tag
    # context.browser = None
    yield
    context.test_case.tearDownClass()
    del context.test_case

def setup_test_case(testcase_class: LiveServerTestCase):
    """Takes a class that's an instance of LiveServerTestCase
    and returns the test case after adding a client and setting it up.

    This allows you to easily adapt for other testcase classes.
    """
    test_case_instance = testcase_class
    test_case_instance.setUpClass()
    # adapted from original to handle e.g. GET requests
    test_case_instance.client = Client()
    # simply adding a testcase with this in fixtures = [...]
    # doesn't load them to the database without additional configuration
    call_command("loaddata", "foia/initial_data/pra_models.json")
    # If we don't use get_or_create, it would try to create multiple
    # google APIs and would fail as a result
    google_api, _ = SocialApp.objects.get_or_create(
        provider="google",
        name="Google API",
        client_id=CLIENT_ID,
        secret=CLIENT_SECRET
    )
    google_api.save()
    return test_case_instance

class DataTestCase(LiveServerTestCase):
    """A light wrapper over LiveServerTestCase
    to add initial data
    """
    fixtures = ["foia/initial_data/pra_models.json"]