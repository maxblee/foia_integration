from behave import given, when, then

import bs4
from django.contrib.auth.models import User
from allauth.socialaccount.models import SocialAccount
from foia.models import PRATemplate, State
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

import sys; sys.path.append("..")
import browser_handling

@given("Jason is logged in")
def logs_in(context):
    username = "jason"
    email = "jason@example.com"
    pwd = "test_example"
    user_create, created = User.objects.get_or_create(
        username=username,
        email=email
    )
    context.user = user_create
    if created:
        context.user.set_password(pwd)
        context.user.save()
    SocialAccount.objects.get_or_create(
        provider="google",
        user=context.user,
        uid="fake_id"
    )
    context.test_case.client.login(username=username, password=pwd)

@given("the {state} data is loaded")
def load_state_data(context, state):
    pass
    # if state != "generic":
    #     State.objects.create(**STATE_DATA[state])

@when("Jason submits the form with his {state} and {language}")
def submits_template(context, state, language):
    context.response = context.test_case.client.post(
        "http://127.0.0.1:8000/template-builder",
        {"state": state, "template-text":language}
    )
    assert context.response.status_code == 200

@then("Jason should have a new template for {state} with {unique_field}")
def has_new_template(context, state, unique_field):
    expected_state = None if state == "generic" else State.objects.get(abbr=state.strip())
    results = PRATemplate.objects.filter(
        template_user=context.user,
        state=expected_state
    )
    assert results.count() == 1
    print(state)
    assert unique_field in {item["text"] for item in results.first().template["template"]}

@when("Jason visits the template page")
def visits_site(context):
    context.response = context.test_case.client.get(
        "http://127.0.0.1:8000/template-builder",
        follow=True
    )
    context.response_html = bs4.BeautifulSoup(context.response.content, "html.parser")

@given("Jason is not logged in")
def not_logged_in(context):
    pass

@then("Jason should have the fields required to submit the form")
def form_has_right_fields(context):
    assert context.response_html.select("select[name=state]") is not None
    assert context.response_html.select("textarea[name=template-text]") is not None
    assert context.response_html.select("input[type=submit]") is not None

@then("Jason should be redirected to the login page")
def redirected_check(context):
    assert ("/?next=/template-builder", 302) in context.response.redirect_chain

@when("Jason goes to the template page")
def visit_template(context):
    context.browser.get("http://127.0.0.1:8000/template-builder")
    assert context.browser.current_url != "http://127.0.0.1:8000/template-builder"

@when("Jason logs in through Google")
def logs_in_google(context):
    browser_handling.login_google(context.browser, go_home=False)

@then("Jason should be redirected back to the template page")
def redirect_template(context):
    _form_elem = WebDriverWait(context.browser, 10).until(
        EC.presence_of_element_located((By.ID, "foia-template"))
    )
    assert context.browser.current_url == "http://127.0.0.1:8000/template-builder"


