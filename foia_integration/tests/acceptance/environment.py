from behave.fixture import use_fixture_by_tag

import fixtures

fixture_registry = {
    "fixture.browser": fixtures.launch_firefox,
    # "fixture.login": fixtures.login_handler
}
