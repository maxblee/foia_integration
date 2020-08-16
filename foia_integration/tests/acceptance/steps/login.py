from behave import given, when, then
import bs4
from django.contrib.auth.models import User
from django.views.generic import TemplateView
from allauth.socialaccount.models import SocialAccount, SocialApp, SocialToken

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
    assert context.response_html.find("div", {"class": "login__info"}) is not None
    assert len(context.response_html.select("[href='/admin/']")) == 0
    assert context.response_html.find("div", {"class": "user__info"}) is None

@given("I am logged in")
def logged_in(context):
    log_in(context)

def log_in(context, admin=False):
    user_create = User.objects.create_superuser if admin else User.objects.create
    username = context.fake.first_name()
    # Using faker both to check against different (unpredictable) values
    # and because we don't reset our database in the middle of a test run
    context.user = user_create(
        username=username, 
        email=context.fake.email()
    )
    pwd = context.fake.pystr()
    # must set and save password because of hashing
    # https://stackoverflow.com/questions/2619102/djangos-self-client-login-does-not-work-in-unit-tests
    context.user.set_password(pwd)
    context.user.save()
    context.test_case.client.login(username=username, password=pwd)

@then("I should see the home page")
def screen_is_home(context):
    assert context.response_html.title.string == "Home | FOIA Integration"

@then("I should see a link to my profile")
def page_has_profile_link(context):
    login_section = context.response_html.find("li", {"id": "login-or-profile"})
    assert login_section.get_text().strip() == "Profile"

@given("my account is connected to a Google account")
def account_connected_to_google(context):
    uid = context.fake.pystr()
    google_account = SocialAccount.objects.create(
        user=context.user,
        provider="google",
        uid=uid
    )
    google_account.save()
    app = SocialApp.objects.get(provider="google")
    token = context.fake.pystr()


@then("I should see a set of links specifically for Google users")
def google_user_links(context):
    assert context.response_html.find("div", {"class": "google__info"}) is not None

@given("I am not logged in through Google")
def login_not_google(context):
    pass

@then("I should not see a set of links for Google users")
def not_google_user_links(context):
    assert context.response_html.find("div", {"class": "google__info"}) is None

@given("I am logged in with administrative privileges")
def has_admin_privileges(context):
    log_in(context, admin=True)

@then("I should see a link to the admin page")
def admin_links_available(context):
    assert len(context.response_html.select("[href='/admin/']")) == 1

@given("I do not have administrative privileges")
def no_admin_privileges(context):
    pass

@then("I should not see a link to the admin page")
def no_admin_link(context):
    assert len(context.response_html.select("[href='/admin/']")) == 0