from behave import given, when, then
import bs4
from django.contrib.auth.models import User
from django.views.generic import TemplateView
from allauth.socialaccount.models import SocialAccount, SocialApp

@given("I am not logged in")
def not_logged_in(context):
    pass

@when("I visit the home page")
def visit_home(context):
    response = context.test_case.client.get("http://127.0.0.1:8000/")
    context.response_html = bs4.BeautifulSoup(response.content, "html.parser")

@then("I should see the login page")
def screen_says_login(context):
    assert context.response_html.title.string == "Log In | FOIA Integration"

@given("I am logged in")
def logged_in(context):
    user = User.objects.create(
        username="example", 
        email="example.gmail.com"
    )
    # must set and save password because of hashing
    # https://stackoverflow.com/questions/2619102/djangos-self-client-login-does-not-work-in-unit-tests
    user.set_password("real_password")
    user.save()
    context.test_case.client.login(username="example", password="real_password")

@then("I should see the home page")
def screen_is_home(context):
    assert context.response_html.title.string == "Home | FOIA Integration"

@then("I should see a link to my profile")
def page_has_profile_link(context):
    assert False

@given("my account is connected to a Google account")
def account_connected_to_google(context):
    pass

@then("I should see a set of links specifically for Google users")
def google_user_links(context):
    assert False

@given("I am not logged in through Google")
def login_not_google(context):
    pass

@then("I should not see a set of links for Google users")
def not_google_user_links(context):
    assert False

@given("I have administrative privileges")
def has_admin_privileges(context):
    pass

@then("I should see a link to the admin page")
def admin_links_available(context):
    assert False

