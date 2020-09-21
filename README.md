# `foia_integration`

This is a Django project designed to help journalists file and manage their public records requests. It's ported over from [`django_sourcebook`](https://github.com/maxblee/django_sourcebook), a quickly built prototype that does much of the same thing. Eventually, once I finish building `foia_integration`, `django_sourcebook` will cease to exist.

## Contents
- [Motivation](#motivation)
- [Setup](#setup)
- [Features](#features)
- [Roadmap](#roadmap)
- [Credits](#credits)

## Motivation

There are a few projects built for helping journalists file a bunch of public records requests.

One is [foiamail](https://github.com/bettergov/foiamail), which allows people to bulk file public records requests and generate status reports on agency responses using `cron`.

Another is [Muckrock](https://www.muckrock.com/), which offers paid plans that allow journalists to file a limited number of public records requests with a friendly UI, paid support, and more.

And there are others, like a [GMail sender from the Miami Herald](https://github.com/mcclatchy/gun-deaths) that were specifically built for filing requests in a single project.

`foia_integration` is meant to serve as a bridge between the single-project, programmatic tools like `foiamail` and the single-request, service-oriented tool in Muckrock.

It is designed for general-purpose use and can handle single public records requests just as well as it can handle bulk-file requests. It currently offers a friendly interface for creating templates and for filing multiple requests at the same time. And eventually, I plan on expanding its functionality to make searching for and responding to requests easier.

In addition, I plan on adding utilities to allow people to connect requests with contact logs, sourcebooks, and projects to make managing public records requests easier.

The result is a project that is a bit less suited for large bulk records requests than `foiamail` and far less suited for requests directed at a single agency than a paid service like Muckrock. (In particular, `foiamail` is designed in a way that allows it to be effectively served from a cloud server like an EC2 running on `cron`.) In other words, if you're dealing with a single projct where you have to keep track of tons of requests, you'll be better off using `foiamail`, and if you're just going to be filing occasional requests, you're going to be better off using Muckrock. (Additionally, there are currently holes in this project, so if you want something that works well for your needs out of the box right now, you'll want to go to one of those other tools.)

## Setup

Full installation instructions are available in [the setup guide](https://www.github.com/maxblee/foia_integration/blob/master/SETUP.md).

Once you have everything installed and you have the Google Developer Console configured, you can type

```sh
python manage.py runserver
```

to start the server and run your site. 

When you load the URL (127.0.0.1:8000 by default), you should see a login page. (**Note: Be sure to be at 127.0.0.1 and not localhost; Google's login does not recognize the two domains as being the same.**)

Click one of the log in links on the home page and sign in with your Google Account.

## Features

`foia_integration` is designed to be full of features designed to make it easier to manage records requests. Because it is still in its infancy, that list of features is fairly small.

Right now, you can:

### Build Templates

If you click on the link for creating a new template, you should see a simple form with a bunch of buttons. The form allows you to select a particular state that you want to build a template for. If you don't have any strong preference, I'd recommend going with "General," which will be used any time you haven't configured a state-specific template.

Then, you can enter text in the large text input field. Any time you click one of the buttons on the form or type `{{` and then the text inside the button and `}}`, you can add general information about the request, like the number of days before the agency has to respond. The only requirement is that you enter a place to put the Requested Records. That's where the records you're asking for go.

Anything outside of the items in those buttons will be written exactly as you typed them in every records request you send with that template. The things inside the buttons will all be computed based on information about the records you're requesting, the agency or recipient you're sending it to, or the state the agency is part of (including the federal government). For the most part, these should be straightforward. But there are a few quirks to keep in mind:

- The listed Public Records Act Name does not include the word "the." So if you want to type something like "Pursuant to the Freedom of Information Act," You should write the word "the."
- "Maximum Response Time" is, unlike everything else here, an entire sentence. Specifically, it says "I look forward to hearing from you" within x time. This is because some states don't have maximum response times specified in statute (although they are often still required to respond promptly). In addition, some states measure their days as business days only, while others measure them as calendar days. The tool will tell people "I look forward to hearing from you within X days" for states that use calendar days, and "I look forward to hearing from you within X business days" for other states.

## Filing and Saving Requests

After filling out a template, you can file and save requests. You get to the form by clicking on the "Send Public Records Requests" link on the home page.

When you get to the form, you can submit information about the records you're requesting in the "Information about the Request" section. You can add information about the people you want the request sent to in the "Information about the Recipients" section.

There are a few ways to use this section. First, you can upload a csv file. This option requires fields to be specified in the following format:

- recipientFirstName : The first name of the recipient
- recipientLastName : The last name of the recipient
- agencyName : The name of the agency
- foiaEmail : The public records email address for the agency
- agencyState : The state of the agency
- agencyStreetAddress : The street address for the agency
- agencyMunicipality : The city the agency is located in
- agencyZip : The ZIP code of the agency

Of these, only `foiaEmail`, `agencyState`, and `agencyName` are required.

Or you can add individual items. The bottom recipient always has an add icon allowing you to add more recipients. In addition, the app will offer auto-fill suggestions of existing contacts. If you click on any of those suggestions, it will fill out all of the data have on that recipient.

Keep in mind that any changes you make to that information except for the email address will not be saved. The application treats the agency's email address as a unique field, and it maintains the original spelling. 

Alternatively, you can manually enter information. This will create new records.

Once you're done adding agencies, you can hit the Save Requests button to save your requests without sending them or the Send Requests button to send all of your requests. The application uses `apscheduler` to launch the requests in a separate process, so the form should submit quickly, regardless of how many agencies you've sent requests to.

## Roadmap

Because this project is in its infancy, there are a number of features I'd like to add.

- Scheduling: I want to add support to allow people to schedule requests to be sent at certain times. For instance, you may want to schedule requests for FOIA logs at the end of every year. 
- Groupings: I want to add support for people to create "Groups" of agencies they want to send requests to regularly. That would allow people to name the type of requests they're sending.
- CRUD: Right now, I just have the "Create" part of the app build (and only some of that). I plan on adding search forms, along with options to delete and update data.

## Credits

This project was inspired or helped in ways by the following:

- I borrowed some of the design of `foiamail` in this project. This project itself is also
heavily inspired by `foiamail`.
- I compiled the data on public records law response times from [Muckrock](https://www.muckrock.com/), [The Reporter's Committee for Freedom of the Press](https://www.rcfp.org/), and the [National Freedom of Information Coalition](https://www.nfoic.org/). All three are also great resources on state and national public records laws.