Feature: Submitting Request

    Logged-in Users should be able to fill out a form and file
    public records requests.

    @fixture.browser
    Scenario: Users should be able to add new agencies and recipients.
        Given Jason is logged in through Google
        When Jason visits the request filing page
        And Jason adds information about an agency
        Then Jason should be able to add new agencies and recipients
        And Jason should be able to delete agencies and recipients he added

    @fixture.browser
    Scenario: Users should be able to add existing agencies and recipients (without retyping everything).
        Given Jason is logged in through Google
        And Jason has created templates for filing requests
        And Jason already has agency information saved
        When Jason starts to fill out information about the agency
        Then Jason should be able to select the agency from a dropdown menu

    # Scenario: Users should be able to change their template and be redirected.
    #     Given Start to type your Given step here
    #     When Start to type your When step here
    #     Then Start to type your Then step here

    @fixture.browser
    Scenario: Users should be able to dynamically view what their requests will look like.
        Given Jason is logged in through Google
        And Jason has created templates for filing requests
        When Jason visits the request filing page
        And Jason adds information about an agency
        And Jason adds information about the records he seeks
        Then Jason should be able to preview the request

    # @fixture.browser
    # Scenario: Users should be able to create requests by uploading a CSV
    #     Given Start to type your Given step here
    #     When Start to type your When step here
    #     Then Start to type your Then step here

    # @fixture.browser
    # Scenario: Users should be able to submit requests and have emails be sent.
    #     Given Start to type your Given step here
    #     When Start to type your When step here
    #     Then Start to type your Then step here