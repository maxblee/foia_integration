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
        # And I should see a link to my profile

    # Scenario: Users who are logged in through Google should see links to upload templates and send emails.
    #     Given I am logged in
    #     And my account is connected to a Google account
    #     When I visit the home page
    #     Then I should see a set of links specifically for Google users

    # Scenario: Users who are logged in but not through Google should not see those links.
    #     Given I am logged in
    #     But I am not logged in through Google
    #     When I visit the home page
    #     Then I should not see  set of links for Google users

    # Scenario: Users administrative privileges should see a link to the admin page.
    #     Given I am logged in
    #     And I have administrative privileges
    #     When I visit the home page
    #     Then I should see a link to the admin page

    # Scenario: Users who are both logged in through Google and have administrative privileges should have access to both sections.
    #     Given I am logged in
    #     And my account is connected to a Google account
    #     And I have administrative privileges
    #     When I visit the home page
    #     Then I should see a set of links specifically for Google users
    #     And I should see a link to the admin page