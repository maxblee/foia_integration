# this needs to be loaded first because it adds
# apps to registry and adds needed environment variables
# for other files
import load_setup; load_setup.setup()
# adapted from https://behave.readthedocs.io/en/latest/usecase_django.html
# and from https://behave.readthedocs.io/en/latest/fixtures.html

from behave import use_fixture
from behave.fixture import use_fixture_by_tag
import foia_fixtures

fixture_registry = {
    "fixture.browser": foia_fixtures.browser
}

def before_all(context):
    use_fixture(foia_fixtures.django_test_runner, context)

def before_scenario(context, scenario):
    use_fixture(foia_fixtures.django_test_case, context)

def before_tag(context, tag):
    if tag.startswith("fixture."):
        return use_fixture_by_tag(tag, context, fixture_registry)