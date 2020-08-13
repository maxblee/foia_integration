from behave import fixture
from selenium import webdriver
from django.contrib.auth.models import User
from django.test import RequestFactory, TestCase
from allauth.socialaccount.models import SocialAccount


@fixture
def launch_firefox(context):
    context.browser = webdriver.Firefox()
    context.browser.implicitly_wait(2)
    yield context.browser
    context.browser.quit()