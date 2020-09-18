"""Tests authentication (redirects + visual presentation) on site."""
import bs4

from tests.functional.common import (
    check_redirect,
    login_google,
    get_urls,
    URL_NAMES,
    REQUIRES_GOOGLE,
)


def test_no_login(client, live_server):
    """Users who are not logged in should be given log in page."""
    response = client.get(live_server.url)
    response_html = bs4.BeautifulSoup(response.content, "html.parser")
    assert response_html.title.string == "Log In | FOIA Integration"
    assert response_html.find("div", {"class": "login__info"}) is not None
    assert len(response_html.select("[href='/admin/']")) == 0


def test_google_login_produces_specific_links(selenium, live_server, base_db):
    """Once users log in through Google, they should be given links that require
    GMail API."""
    selenium.get(live_server.url)
    login_google(selenium)
    assert len(selenium.find_elements_by_class_name("google__info")) > 0


def test_all_logged_in_users_see_profile(client, live_server, create_user, base_db):
    """All users who are logged in should see the home page
    and a link for their profile (Google users and Admin)"""
    username = create_user["username"]
    password = create_user["password"]
    client.login(username=username, password=password)
    response = client.get(live_server.url)
    response_html = bs4.BeautifulSoup(response.content, "html.parser")
    assert response_html.title.string == "Home | FOIA Integration"
    login_section = response_html.find("li", {"id": "login-or-profile"})
    assert login_section.get_text().strip() == "Profile"


def test_user_logged_in_not_google_no_google_links(
    client, live_server, create_user, base_db
):
    """Users who are logged in but do not have Google permissions
    shouldn't see Google page."""
    client.login(username=create_user["username"], password=create_user["password"])
    response = client.get(live_server.url)
    response_html = bs4.BeautifulSoup(response.content, "html.parser")
    assert response_html.find("div", {"class": "google__info"}) is None


def test_not_admin_has_no_admin_link(client, live_server, create_user, base_db):
    """People who are logged in but don't have admin accounts shouldn't get a link
    to the admin page."""
    client.login(username=create_user["username"], password=create_user["password"])
    response = client.get(live_server.url)
    response_html = bs4.BeautifulSoup(response.content, "html.parser")
    assert len(response_html.select("[href='/admin/']")) == 0


def test_admin_has_admin_link(admin_client, live_server, base_db):
    """Admin accounts should get a link to the admin page on the home page."""
    response = admin_client.get(live_server.url)
    response_html = bs4.BeautifulSoup(response.content, "html.parser")
    assert len(response_html.select("[href='/admin/']")) == 1


def test_requires_login(client, live_server):
    """The only URL that shouldn't redirect to the home page is the index
    url (everything else requires authentication)."""
    url_requires_login = [url for url in URL_NAMES if url != "index"]
    for rel_path, url in get_urls(live_server.url, url_requires_login):
        check_redirect(client, url, rel_path, "/")


def test_requires_google_login(client, live_server, create_user, base_db):
    client.login(username=create_user["username"], password=create_user["password"])
    for rel_path, url in get_urls(live_server.url, REQUIRES_GOOGLE):
        check_redirect(client, url, rel_path, "/")
