# Setup

## Step One: Setting up PostgreSQL

First, you need to set up a PostgreSQL database in order to use this Django app. The first step for this is installing PostgreSQL.
I'm using PostgreSQL 12.2. 

After you've installed PostgreSQL, you should set up a user for this tool. You can do this by typing:

```sh
$ sudo -u postgres createuser --interactive
```

Note that if you want to develop on this system and run tests, you should allow your user to create databases. 

And once you've created a user, you should create a new database:

```sh
$ createdb <YOUR_DATABASE_NAME>
```

From here you can run

```sh
$ sudo adduser <YOUR_DATABASE AND ROLE NAME>
$ sudo -u <YOUR_DATABASE_AND_ROLE_NAME> psql
```

To log yourself into psql, and then you can run

```sh
=> ALTER USER <YOUR_ROLE_NAME> WITH PASSWORD <YOUR_PASSWORD>;
```

You can read a full description of this setup [in DigitalOcean](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-postgresql-on-ubuntu-18-04).

Once you've set up PostgreSQL, you should save your database configuration in environment variables.

These are the default settings in the `settings.py` for the project:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': "foia_integration",
        "USER": os.environ["POSTGRES_USER"],
        "PASSWORD": os.environ["POSTGRES_PWD"],
        "HOST": "localhost",
        "PORT": os.environ.get("POSTGRES_PORT", "5432")
    }
}
```

You can, of course, change those if you wish. If you don't, you must set environment
variables for `POSTGRES_USER` and `POSTGRES_PWD`. You can do this in bash
using

```sh
# The actual file may be different depending on your OS and shell.
# bashrc is used by default in Ubuntu
$ echo "
export POSTGRES_USER=<YOUR USERNAME>
export POSTGRES_PWD=<YOUR PASSWORD>
" >> ~/.bashrc
# this just reloads your bashrc with these new environment variables
$ source ~/.bashrc
```

## Step Two: Setting up Google
In order to run this app, you need to configure an app in Google's developer console.

[This guide](https://medium.com/@whizzoe/in-5-mins-set-up-google-login-to-sign-up-users-on-django-e71d5c38f5d5#c9ca) provides a good overview on setting this up.

## Step Three: Setting up Django

Finally, you need to set up Django. The first requirement for doing this is simply
installing all of the packages. Using `pipenv`, you can run

```sh
$ pipenv install
```

to load all the dependencies.

Next, you need to create a superuser and set up your database with some initial
data.

```sh
$ cd foia_integration
$ python manage.py migrate
$ python manage.py loaddata
$ python manage.py createsuperuser
```

After following all of the prompts, you just have one more thing to do. First, you should start Django's server and go to the Admin page (http://127.0.0.1:8000/admin):

```
$ python manage.py runserver
```

From here, you need to log in using the superuser credentials you just created.

Then, you need to go to the Site panel on the admin page and click on the green plus sign to add a new site. Now, configure the domain and the name with one of the URIs you authorized in the developer console. If you authorized Google to use multiple sites, you can use multiple sites.

Then, you should go back to the admin page and add a "Social application." Click the choice for Google, add a name for it, and add your client ID and your secret key (which can be found in the developer console). Move over the site(s) you want to use to have them connected with your account.

Now, if you log out of your admin account, visit http://127.0.0.1 and log in through Google, you should be able to fully use the site.

## Step Four (Optional): Testing Setup

If you want to get set up to run tests, there are a few additional small things you need to get set up. First, you should download the development dependencies:

```sh
$ pipenv install --dev
```

Next, you will need to [download chromedriver and its dependencies](https://chromedriver.chromium.org/) in order to use them with selenium.

You should also set up a GMail account to run tests on and add permissions for your app to run on http://127.0.0.1:8081, the port I have set up for the live server in functional texts. 

Finally, you will need to configure a number of environment variables (primarily so we can test to make sure that the functions work against a real live testing GMail account.) I've used a dotenv file for saving these files that looks something like this:

```
GOOGLE_APP_CLIENT=<YOUR_GMAIL_CLIENT_ID>
GOOGLE_APP_SECRET=<YOUR_GMAIL_SECRET>
DJANGO_SETTINGS_MODULE=foia_integration.settings
TEST_GMAIL_PASSWORD=<PASSWORD FOR YOUR TEST GMAIL ACCOUNT>
TEST_GMAIL_USER=<USERNAME FOR YOUR TEST GMAIL ACCOUNT>
```

In order to run the full test suite, you can type `sh util_scripts.sh test`. This will run `black` on all of the Python files, run tests and `flake8` on the Python side of the app, rand run auto-formatting, linting, and tests on the JavaScript apps.

In order to simply run tests on Python, you can type

```sh
pytest
```

All of the individual JavaScript apps can be tested
using `npm run test`.