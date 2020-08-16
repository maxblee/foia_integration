import os

# adapted from https://behave.readthedocs.io/en/latest/usecase_django.html
from behave import fixture
from django.test.runner import DiscoverRunner
from django.test.testcases import LiveServerTestCase
from django.test import Client
from allauth.socialaccount.models import SocialApp

CLIENT_ID = os.environ["GOOGLE_APP_CLIENT"]
CLIENT_SECRET = os.environ["GOOGLE_APP_SECRET"]

@fixture
def django_test_runner(context):
    context.test_runner = DiscoverRunner()
    context.test_runner.setup_test_environment()
    context.old_db_config = context.test_runner.setup_databases()
    yield
    context.test_runner.teardown_databases(context.old_db_config)
    context.test_runner.teardown_test_environment()

@fixture
def django_test_case(context):
    context.test_case = setup_test_case(LiveServerTestCase)
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
    # HACK: We need to create the Google provider
    # but we can't have more than one object.
    # This works, but there's probably a better way to implement it
    # using e.g. a subclass of testcase
    google_api, _ = SocialApp.objects.get_or_create(
        provider="google",
        name="Google API",
        client_id=CLIENT_ID,
        secret=CLIENT_SECRET
    )
    google_api.save()
    return test_case_instance