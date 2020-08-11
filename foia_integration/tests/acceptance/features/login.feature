Feature: Login

    Logged in users should get access to upload templates, view templates,
    and send emails. People who are not logged in should only
    get access to a splash screen.

    Scenario: Users who are not logged in should see a log-in screen on the home page.
        Given I am not logged in
        When I visit the home page
        Then I should see a screen telling me to log in

    Scenario: Users who are logged in should see a different page.
        Given I am logged in
        When I visit the home page
        Then I should see a different page.

    # Scenario: Logged-in users should see utilities to add public records templates
    # and to file public records requests.
    #     Given I am logged in
    #     When I visit the home page
    #     Then I should see an option to upload public records request templates
    #     And I should see an option to send records requests.

    # Scenario: Users who are not logged in should not be able to upload 
    # records request templates or file public records requests.
    #     Given I am not logged in
    #     When I try to upload a records request template
    #     Then I should be forbidden from doing so.

    # Scenario: Users who are not logged in should be able to start an account.
    #     Given  I am not logged in
    #     When I enter information about myself into the create account system
    #     And I enter information to get credentials from GMail
    #     Then I should be able to create an account
    #     And I should be able to log into that account.

    # Scenario: Users should be able to add or delete any information about themselves,
    # but not about anyone else.
    #     Given I am logged in
    #     When I try to remove information about a public records request I sent
    #     Then I should be able to delete that request
    #     But I should not be able to delete any requests that Eliza sent.
