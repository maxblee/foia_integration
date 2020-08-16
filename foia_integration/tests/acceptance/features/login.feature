Feature: Login

    Logged in users should get access to upload templates, view templates,
    and send emails. People who are not logged in should only
    get access to a splash screen.

    Scenario: Users who are not logged in should see a log-in screen on the home page.
        Given I am not logged in
        When I visit the home page
        Then I should see the login page

    Scenario: Users who are logged in should see a different page.
        Given I am logged in
        When I visit the home page
        Then I should see the home page
        And I should see a link to my profile

    Scenario: Users who are logged in but not through Google should not see those links.
        Given I am logged in
        But I am not logged in through Google
        When I visit the home page
        Then I should not see a set of links for Google users

    Scenario: Users with administrative privileges should see a link to the admin page.
        Given I am logged in with administrative privileges
        When I visit the home page
        Then I should see a link to the admin page

    Scenario: Users without administrative privileges should not see a link to the admin page.
        Given I am logged in
        But I do not have administrative privileges
        When I visit the home page
        Then I should not see a link to the admin page

    @fixture.browser
    Scenario: Users who are logged in through Google should see links to upload templates and send emails.
        Given I have a Google account
        When I move to the home page
        And I log in through Google
        Then I should see a set of links specifically for Google users