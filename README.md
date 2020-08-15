## Setup

### Step One: Setting up PostgreSQL

First, you need to set up a PostgreSQL database in order to use this Django app.
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

By default, the database this uses is named `foia_integration`; you must also set that up.

### Step Two: Setting up Django

- environment loading
- precompilation
- database migrate + superuser creation

```sh
pipenv install
cd foia_integration
npm install
util_scripts
```

### Step Three: Setting Up Google Account