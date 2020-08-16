# this needs to be loaded first because it adds
# apps to registry and adds needed environment variables
# for other files
import load_setup; load_setup.setup()
# from https://behave.readthedocs.io/en/latest/usecase_django.html
from behave import use_fixture
import foia_fixtures

def before_all(context):
    use_fixture(foia_fixtures.django_test_runner, context)

def before_scenario(context, scenario):
    use_fixture(foia_fixtures.django_test_case, context)