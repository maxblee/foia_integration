from behave import given, when, then
import bs4
from django.contrib.auth.models import User
from django.views.generic import TemplateView
from allauth.socialaccount.models import SocialAccount

@given("I am not logged in")
def not_logged_in(context):
    pass

@when("I visit the home page")
def visit_home(context):
    response = context.test.client.get("http://127.0.0.1:8000/")
    context.response_html = bs4.BeautifulSoup(response.content, "html.parser")

@then("I should see the login page.")
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
    context.test.client.login(username="example", password="real_password")

@then("I should see the home page.")
def screen_is_home(context):
    print(context.response_html.title.string)
    assert context.response_html.title.string == "Home | FOIA Integration"