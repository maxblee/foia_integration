Feature: FOIA Template

    A user wants to be able to send a public records request
    to a bunch of different agencies.

    Assuming s/he has added credentials to his or her G-Mail
    account, s/he should be able to upload any number of templates,
    fill out a form with generic information about the public records
    request, and should be able to send out that information to the relevant
    people.

    Background: Jason files a ton of public records requests. He wants to be able to file a public records request to a bunch of different agencies, but he has specific templates he wants to use.

    Scenario: Jason visits the template page
        Given Jason is logged in
        When Jason visits the template page
        Then Jason should have the fields required to submit the form

    Scenario Outline: Jason wants to create a set of templates.
        Given Jason is logged in
        And the <state> data is loaded
        When Jason submits the form with his <state> and <language>
        Then Jason should have a new template for <state> with <unique_field>

        Examples:
            | state    | language                                                                                                                                             | unique_field                 |
            | generic  | Dear Public Records Officer:\nI am requesting the following records under {{Public Records Act Name}}:\n{{Requested Records}}                        | Public Records Act Name      |
            | US       | Dear FOIA Officer:\nI am requesting the following records under the Freedom of Information Act:\n{{Requested Records}}\n{{Fee Waiver Justification}} | Fee Waiver Justification     |
            | AZ       | Dear {{Recipient Name}}:\nI am requesting the following records under the Arizona Public Records Law, §39-121 et seq.:\n{{Requested Records}}        | Recipient Name               |

    Scenario: Jason goes to the template page while logged out.
        Given Jason is not logged in
        When Jason visits the template page
        Then Jason should be redirected to the login page

    @fixture.browser
    Scenario: Jason goes to the template page while logged out an logs back in
        Given Jason is not logged in
        When Jason goes to the template page
        And Jason logs in through Google
        Then Jason should be redirected back to the template page