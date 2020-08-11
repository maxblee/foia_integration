# Feature: FOIA Template to Email

#     A user wants to be able to send a public records request
#     to a bunch of different agencies.

#     Assuming s/he has added credentials to his or her G-Mail
#     account, s/he should be able to upload any number of templates,
#     fill out a form with generic information about the public records
#     request, and should be able to send out that information to the relevant
#     people.

#     Background: Jason files a ton of public records requests. He wants to be able to file a public records request to a bunch of different agencies, but he has specific templates he wants to use.

#     Scenario: Jason wants to add a special template for Arizona so he can cite particular
#     language in Arizona's pulic records law when filing requests there.
#         Given Jason has particular language he uses when filing requests in Arizona
#         When Jason adds template language into a templating form on the FOIA site
#         Then the FOIA request system should store a record showing the language he uses for Arizona requests.

#     Scenario: Jason wants to file a public records request in Arizona.
#         Given Jason has uploaded a valid template for Arizona
#         When he enters valid information about who he plans to send the request to, what records he's seeking, and a general description of the request
#         Then the FOIA request system will fill out his Arizona template
#         And it will send the request to the intended recipient
#         And it will store a record of the request so Jason can keep track of it.

#     Scenario: Jason has a generic template he uses in states where he doesn't usually file
#     requests, and he wants to use that template.
#         When Jason goes to file a records request in Alaska
#         And he has uploaded a generic template 
#         But he doesn't have a template for Alaska
#         Then the FOIA request system will use his generic template to file the request.