---
layout: post
title: Deploying Django projects
date: 2016-09-05
topics: web
---

It takes 5 minutes for anyone with a passing familiarity with web development to get to Django's "It Worked!" page after starting from scratch in a clean development environment.  And then it takes 5 days to figure out how to deploy your simple 'Hello World' application to a production server.  In this post I will describe a recipe for deployment of Django projects so you can focus on application development rather than wrestling with 500s.

<!--excerpt-->

It takes 5 minutes for anyone with a passing familiarity with web development to get to Django's "It Worked!" page after starting from scratch in a clean development environment.  And then it takes 5 days to figure out how to deploy your simple 'Hello World' application to a production server.  In this post I will describe a recipe for deployment of Django projects so you can focus on application development rather than wrestling with 500s.

Like all good recipes, this one will only work if you have the same ingredients and tools in your kitchen.  The stack I am using may not be the stack of choice among Django developers, and you may want to do things differently.  So, like all good chefs, you should carefully review the procedures I'm using to make sure you understand them and that they work for you.  This is simply one way among a thousand ways of deploying Django projects.

I haven't used Django since before version 1.0, so I had a lot of catching up to do to bring my dusty memories up to speed.  Whenever I start up with a new framework, I can't really settle down and do any serious coding until I've seen the big picture---I need to get a basic app working in production first or I'll always have this nagging feeling that what I'm doing is completely off track and will never work.  The ease with which Django's development server lets you spin up a basic site running on your local machine is entirely too deceptive.  It's a long road to get from there to a real working deploy and I don't want to travel too far down some path without first verifying that the basic skeleton of the project will actually serve for reals.

I went down this road last year when I was working with [Flask](http://flask.pocoo.org/).  In my [Adventures with Flask](/15/adventures-with-flask.html) post, I discussed [flask-db-test](https://github.com/czep/flask-db-test), a simple yet flexible Flask app that can serve as a foundation for developing larger projects.  The primary purpose was to verify that production database connections were working as expected.  So now I'm going to do the same thing again but this time for Django with the current release version of 1.10.

Professional Django shops have a wealth of mature tools and processes readily available with well structured development, testing, staging, and production environments that completely automate the pain of manual deployment.  The rest of us have google and a few snippets of commands here and there that we cobble together from past attempts which results in a lot of head-scratching when the damn site just won't work.  Naturally, a lot of this head scratching goes away the second (or twenty-second) time and you then begin to have a decent handle on how to take a clean slate project to production.

This is mainly for my own benefit, to codify the failures I've made over the past week and spend the time documenting what I've done so that I can get down to writing some real code and not have to worry about how I'll actually be able to get the site to see the light of day.  However, I hope to also provide some benefit to others, especially surrounding the great mystery of SELinux.  In my research I found a lot of people encountering similar problems as well as a lot of bad advice that I do not wish myself or others to repeat.

In addition to my Adventures with Flask article, this post also builds a great deal on my [Svelte Apache](/16/svelte-apache.html) post.  You don't have to use Apache to deploy Django applications, but the instructions documented here are based primarily for using apache.  Just so we're all on the same page, let me now describe the stack I am using.

## The czep django stack

* Deployment environment: EC2
* OS: Fedora
* Web server: Apache
* Scripting language: Python3
* WSGI adapter: mod_wsgi
* Framework: Django
* Database: PostgreSQL
* Database adapter: psycopg2
* Local development: Vagrant

You'll notice a few differences between this stack and the one I described in last year's post when I was working with Flask.  The first notable difference is that I've replaced CentOS with Fedora.  Over the past year I've been using Fedora a lot more often than CentOS and now prefer the fast-paced bleeding-edge that reminds me of what linux was like back in the 90s.  I approached this switch with a bit of trepidation, after all I had grown used to the comfortable corporate confines of CentOS---stable APIs, mature tools, no surprises.  I like the fact that code I write or systems I build for CentOS can be transferred to RHEL with ease.  But for my personal projects I found CentOS moving a bit too slowly.  It was getting tiresome to setup the Postgres rpm manually every time I wanted a relatively recent version.  The same was true for apache, python, and a lot of other important packages---the mainline versions were always quite a few revisions behind what I wanted to be working with.  With Fedora, everything moves very quickly.  Sometimes too quickly!  So expect your code to break here and there as it will definitely keep you on your toes.  Be sure to run `dnf update` as often as possible, and check those release notes carefully.

Another change I would like to call out is that I'm mainly developing with python3 these days.  Compared to a year ago, it's been awhile since I found a package that only works on python 2 and now a lot of libraries, even numpy and scipy, actually work more smoothly on python3.  Having `venv` built into the standard library is also very convenient.  I'm a dinosaur in many ways but when it comes to python I'd rather stay on the up and up.

Lastly I'd like to mention that my primary choice for local development is to use [Vagrant](https://www.vagrantup.com/).  OSX is a great desktop environment but when all your prod is on linux, there are just enough differences between these environments to make simple things too troublesome.  Discovering vagrant was a breath of fresh air.  I've been using Virtualbox since time immemorial to spin up mini-prod VMs to resemble my EC2 instances as closely as possible, but the beauty of Vagrant is that it automates the management of your virtual machines.  This way you don't have to manually create, edit, and clone your VMs in the Virtualbox interface anymore.  With vagrant, you have a simple config file and a few commands that let you quickly build a semblance of your production environment working on your laptop.

Once again I'll reiterate that Apache occupies a central position in my stack and this is not likely to change anytime soon.  While I have a great deal of respect for the many great alternatives in the web and application server space, apache is still in my opinion the most trusted and robust platform for serving web apps.

## Django from scratch

I'll be honest here, I'm not a real web developer.  I'm a data scientist who sometimes needs to write web applications.  Hence the reason it took me 5 days to figure out how to deploy on my stack!  My last foray with Django was around 2010 and I hadn't been involved with it again until a few weeks ago.  I started reading some blogs, and of course the excellent [Django documentation](https://docs.djangoproject.com/), and then picked up a copy of the most excellent book [Two Scoops of Django](https://www.twoscoopspress.com/products/two-scoops-of-django-1-8) by Daniel and Audrey Roy Greenfeld.  I also benefited greatly from [Arun Ravindran's](http://arunrocks.com/) [Edge template](http://arunrocks.com/edge-v2/) and also his excellent book [Django Design Patterns and Best Practices](https://www.amazon.com/dp/B00VIBPW0I/).  Two other great resources to review include the [django-kevin](https://github.com/imkevinxu/django-kevin) startproject template and [Rayed's](https://rayed.com/wordpress/?p=1266) set of concise example [Django CRUD apps](https://github.com/rayed/django_crud).

When I started writing [django-stuff](https://github.com/czep/django-stuff), I wanted to build it completely from scratch using an amalgam of the various organizational processes I picked up from the above sources.  The current version of [cookiecutter-django](https://github.com/pydanny/cookiecutter-django) is way too cutting edge for me and deviates rather substantially from the published version of the Two Scoops book based on Django 1.8.  The layout I chose here largely follows the published book version.  It's perfectly fine to start out with `startproject` and `startapp` but you'll have to do a lot of reshuffling to get the default layout into one that follows the book's recommendations.  Here is the layout I began when building django-stuff:

```bash
# how czep starts a django project
mkdir stuff & cd stuff
touch .gitignore
mkdir requirements site
touch requirements/{base,dev,prod}.txt
touch site/manage.py
mkdir site/{static,templates,config,apps}
touch site/config/{__init__,urls,wsgi}.py
mkdir site/config/settings
touch site/config/settings/{__init__,base,dev,prod}.py
touch site/apps/__init__.py
mkdir site/apps/stuff
touch site/apps/stuff/{__init__,admin,forms,models,tests,urls,views}.py
mkdir site/apps/stuff/migrations
touch site/apps/stuff/migrations/__init__.py
```

I like the idea of having a "repository root" directory outside of the Django "project root" so that you have a place for ancillary files, documentation, your `.gitignore` file and other assorted development cruft.  My Django project root folder is generically named `site` instead of using the project name directly.  This was primarily because I disliked having directory structures that looked like `~/work/stuff/stuff/stuff/config/settings`.  When you're navigating such a hierarchy, it very quickly becomes difficult to know which `stuff` directory you are in and which one needs to be named in configuration files and so on.  It also makes automation a little easier because you know that `site/config/settings` will appear in every project and you don't need to substitute the project name in scripts.  For a similar reason, I place all apps in a `site/apps` directory.  It keeps the Django project root directory cleaner.

Now we need to add some substance to the project and we'll start by copying some standard stuff to the boilerplate files that provide the skeletal structure of a Django project.

```bash
# boilerplate files to edit
.gitignore
requirements/base.txt
requirements/dev.txt
requirements/prod.txt
site/manage.py
site/config/urls.py
site/config/wsgi.py
site/config/settings/base.py
site/config/settings/dev.py
site/config/settings/prod.py
```

A lot of this is window-dressing at this point.  The only critical files you really need to bootstrap a Django project are `manage.py`, `settings.py`, and `urls.py`.

```bash
# db setup
createdb stuff

# it should actually work at this point
python3 -m venv ~/.venv/stuff
source ~/.venv/stuff/bin/activate
pip install -r requirements/dev.txt
python manage.py runserver
```

Now to add an app, we create a new directory under `site/apps` and fill in the necessary python files.

```bash
# create a basic crud app called 'stuff'
site/apps/stuff/
    models.py
    admin.py
    views.py
    urls.py
```

Here is a basic checklist for developing a new Django app within an existing project.  Credit goes to Rayed here because the main bullet points are taken from his [excellent blog post](https://rayed.com/wordpress/?p=1266) describing his example CRUD app.

* Create an App
    * `python manage.py startapp` or create the files manually
    * add to INSTALLED_APPS
* Create the Model
    * app/models.py
    * `python manage.py makemigrations`
    * `python manage.py migrate`
* Create the Admin Interface
    * app/admin.py
* Create the Views
    * app/views.py
* Setup the URL patterns
    * app/urls.py
    * add to config/urls.py
* Create the Templates
    * `mkdir templates/stuff`
    * `touch templates/stuff/{stuff_form,stuff_list,stuff_confirm_delete}.html`

## Introducing django-stuff

[django-stuff](https://github.com/czep/django-stuff) is a very basic Django project whose primary purpose is to provide a starting point for more advanced projects.  It is intended to serve mainly as a skeletal outline which you can use to develop and test a production deployment process.  There are no dependencies apart from Django itself and [psycopg2](http://initd.org/psycopg/) for connecting to a [PostgreSQL](https://www.postgresql.org/) database.  There is a single app called 'stuff' which has basic CRUD functionality.  The model has three fields---junk, things, and somenum.  The landing page is a list view of all the stuff in the database.  Authenticated users can make new stuff or edit or delete existing stuff.  There are no provisions for creating users except through the admin interface.  (If you would prefer to test all CRUD features without requiring authentication, simply remove the decorators in [views.py](https://github.com/czep/django-stuff/blob/master/site/apps/stuff/views.py)).


## Deploy to vagrant

Ok, now let's get on to the fun stuff.  We're going to use vagrant to create a virtual machine that very closely resembles the stack we will be using live in production on EC2.  Run `vagrant init` in your repository root to create a Vagrantfile.  Next, download the Vagrant image from Fedora Cloud and add it to your project with `vagrant box add`.  Then we bring up the box and ssh into it.

```bash
# setup vagrant
vagrant init
vagrant box add ~/path/to/Fedora-...vagrant-virtualbox.box --name stuff
vagrant up
vagrant ssh

```

Simplicity!  Now let's get our box in gear by adding all the packages we need to deploy our Django project.  Note that you could do this automagically by passing a script and using `vagrant provision` command, but for grins---and to demonstrate how easy it is despite that it took me 5 days to figure out---we will just do this manually.

```bash
# be root!
sudo /bin/bash

# install all the packages we need
dnf update -y
dnf install -y vim git
dnf groupinstall -y "C Development Tools and Libraries"
dnf install -y httpd mod_ssl openssl mod_wsgi python-devel httpd-devel
dnf install -y postgresql-contrib postgresql-devel postgresql-test
dnf install -y python3-devel redhat-rpm-config policycoreutils-python-utils python3-mod_wsgi

# setup webserver admin group and directories
groupadd webadmin
usermod -a -G webadmin vagrant
mkdir /var/www/{wsgi-scripts,apps}
chown -R root:webadmin /var/www
chmod 2775 /var/www
find /var/www -type d -exec chmod 2775 {} +
find /var/www -type f -exec chmod 0664 {} +
chown -R root:webadmin /etc/httpd/conf
chmod 2775 /etc/httpd/conf
find /etc/httpd/conf -type f -exec chmod 0664 {} +

# fire up apache
systemctl start httpd.service
systemctl enable httpd.service
```

If you have enabled port forwarding to your VM's port 80 in your `Vagrantfile`, then you should be able to see the default apache page by visiting [http://localhost:8080](http://localhost:8080). There are a few idiosyncracies I will point out here in case you would prefer to do things differently.  By default in a RedHat system, apache's Document Root is `/var/www/html`.  The only other folder placed there by the system is `/var/www/cgi-bin` which of course hasn't been of much use since about 1999.  Web applications deployed using mod_wsgi can be stored anywhere on the file system as long as apache is given access to read the code.  We see many tutorials where code is deployed in home directories or maybe under `/opt`.  My preference is to store them in a `/var/www/apps` directory.  Note that this is not a security risk because it is still outside of Document Root.  It would not be safe to deploy the code to `/var/www/html` because then apache could serve the source code of your application.

On my systems I typically create a `webadmin` group and give this group ownership of `/var/www/` directories and files with permissions for group members to read and write.  This way if I want to grant another user access to edit the files, either in apache's Document Root or deploy new web apps, I can give them group membership to `webadmin` rather than my own user credentials or root credentials.  For the same reason, `webadmin` has write privileges for the apache configuration folder.  Note here that I add the user `vagrant` to the webadmin group.  In production you would substitute this for your username.

Our next step is to initialize postgres and create a role and database for our web app to use.  Note that this will require the use of md5 hashed passwords for any user to connect to the database server.  Be sure to check `/var/lib/pgsql/data/pg_hba.conf` to ensure it meets your needs and security requirements.

```bash
# as root, become the postgres user to initialize the postgres installation
sudo su postgres
initdb -D /var/lib/pgsql/data -A md5 -U postgres -W
pg_ctl -D /var/lib/pgsql/data -l /var/lib/pgsql/logfile start

# create a role for our web app
createuser -e -E -P -W stuff

# create a database for our web app owned by the role
createdb -W -e -O stuff stuff

# return to root and enable postgres to start at boot time
exit
sudo systemctl enable postgresql
```

### Deploying django-stuff

Now we're ready to deploy the source code for our Django project.  Exit out of the root shell, create a directory for our code, and initialize a virtual environment.

```bash
# get our source code
cd /var/www/apps
mkdir stuff & cd stuff
git clone https://github.com/czep/django-stuff.git .

# create and activate a virtual environment
mkdir .venv
python3 -m venv .venv/webdev
source .venv/webdev/bin/activate
pip install -r requirements/prod.txt
```

You can run a quick check with `python -m django --version` to ensure that Django is now available in your virtual environment.  Note also that I have created the venv folder within the repository root of the project.  You can store the virtual environments anyplace you wish but I find that keeping them associated with the project source makes for better organization.  If you choose another location, you may have different SELinux contexts to troubleshoot.

Now a few housekeeping commands to prepare our web app.

```bash
# add some required environment variables
export SECRET_KEY='your secret key here'
export DB_NAME=stuff
export DB_USER=stuff
export DB_PASS=somepasswordhere

# initialize the db and collect static files
cd site
python manage.py migrate --settings=config.settings.prod
python manage.py createsuperuser --settings=config.settings.prod
python manage.py collectstatic --settings=config.settings.prod
```

Like any good [12 factor](https://12factor.net/) app, it's wise to keep secret keys out of version control and in environment variables.  When interacting with `manage.py` or `django-admin`, you'll need to have these environment variables set in your shell first.  For production, you need to create a special file to hold the environment variables and pass them along to apache in [wsgi.py](https://github.com/czep/django-stuff/blob/master/site/config/wsgi.py).

```python
"""
    .env-prod.py

    sudo chown apache:webadmin .env-prod.py
    sudo chmod 460 .env-prod.py
"""
os.environ['SECRET_KEY'] = 'your secret key here'
os.environ['DB_NAME'] = 'stuff'
os.environ['DB_USER'] = 'stuff'
os.environ['DB_PASS'] = 'somepasswordhere'
```

I struggled with this a bit and am still not 100% convinced it's the best way to do things, but it works and appears relatively safe.  It's an oft-repeated mis-conception that you can't use environment variables with apache.  Sure you can, but the process is slightly different depending on OS packaging.  The solution I adopted here is based on Graham Dumpleton's advice in [this gist about setting environment variables](https://gist.github.com/GrahamDumpleton/b380652b768e81a7f60c).

Also note the slightly unconventional file permissions of 460.  This is because we want apache to be able to read the file, but not write to it.  We also want `webadmin` group members to read and write, but since it contains secrets, we want no read permissions for anyone else.

### Apache configuration

In the source repository for django-stuff, I've included a sample [httpd.conf](https://github.com/czep/django-stuff/blob/master/conf/httpd.conf) based on my [Svelte Apache](http://czep.net/16/svelte-apache.html) recommendations for using mod_wsgi and SSL.  There are a few notable differences.  First, since we are using python3 in our virtual environment, make sure you load the correct version of mod_wsgi:

```apache
LoadModule wsgi_module modules/mod_wsgi_python3.so
```

The critical directives you will need to add in order to enable apache to serve django-stuff are the following:

    # WSGI config
    WSGIScriptAlias /stuff /var/www/apps/stuff/site/config/wsgi.py
    WSGIDaemonProcess stuff python-home=/var/www/apps/stuff/.venv/webdev/ python-path=/var/www/apps/stuff/site
    WSGIProcessGroup stuff

    <Directory /var/www/apps/stuff/site/config>
        <Files wsgi.py>
            Require all granted
        </Files>
    </Directory>

    Alias /static/ /var/www/html/static/

    <Directory /var/www/html/static>
        Require all granted
    </Directory>


Here we are going to mount the app at `/stuff`, rather than the root directory of the web server.  Note very carefully the `WSGIDaemonProcess` directive as you need to specify the correct values for both the `python-home` and `python-path` arguments.

### SELinux configuration

Lastly, but of paramount importance for the correct and safe operation of your site, you need to do the monkey dance with SELinux.  What you may want to do at this point---and in fact anytime during development when you are troubleshooting strange errors---is to temporarily disable SELinux with `sudo setenforcing 0`.  I agree wholeheartedly that SELinux can be a royal pain in the keester, but I will never recommend to anyone to ever run in production without it.  It is a tough system to learn, and I still barely understand it myself, which is why this part is always more difficult than it should be.  But there are also very good tutorials and tools for troubleshooting SELinux issues.  For instance, `sudo journalctl -n 80` to get a list of the most recent audit logs.  There's also `audit2allow`.

There are 2 problems with the way we've deployed our web application which will cause SELinux to restrict apache from doing what we want it to do.  I'll describe them here and show you how to solve them.

After reaching this point, visiting [http://localhost:8080/stuff/](http://localhost:8080/stuff/) in your browser will most certainly result in a 500.  The apache error log will provide a nice vague error message:

    django.core.exceptions.ImproperlyConfigured: Error loading psycopg2 module: /var/www/apps/stuff/.venv/webdev/lib64/python3.5/site-packages/psycopg2/_psycopg.cpython-35m-x86_64-linux-gnu.so: failed to map segment from shared object

Although not particularly obvious from this error message, what's happening here is that apache is being prevented from accessing object code in the psycopg2 shared library within our virtual environment.  This is because all the files created in `/var/wwww/` have an SELinux file context of `httpd_sys_content_t`.  However, this is object code we're dealing with, and in order to be able to map to code in a shared library, the httpd process can only do this with files having a context of `httpd_sys_script_exec_t`.  So we will need to change the file context and relabel:

```bash
sudo semanage fcontext -a -t httpd_sys_script_exec_t /var/www/apps/stuff/.venv/webdev/lib/python3.5/site-packages/psycopg2/_psycopg.cpython-35m-x86_64-linux-gnu.so
sudo restorecon -vv /var/www/apps/stuff/.venv/webdev/lib/python3.5/site-packages/psycopg2/_psycopg.cpython-35m-x86_64-linux-gnu.so
```

If you read that very closely (which I admit is difficult given the line length limitations), you will have noticed a very subtle difference between the file as reported in the error message and the file that I actually re-labelled.  The error message refers to:

    .venv/webdev/lib64/...

but I've specified this instead:

    .venv/webdev/lib/...

It took me several hours to discover why my original attempts at relabeling the file continued to fail over and over.  I realied that `chcon` worked but `semanage fcontext` would continue to stubbornly fail.  Then I discovered this [5 year old bug report](https://bugzilla.redhat.com/show_bug.cgi?id=753907) and specifically this little comment from Dan Walsh:

> The problem is label substitution.
> We substitute /usr/lib for /usr/lib64 in restorecon.

A-ha!  The problem is that `restorecon` does not like symbolic links and in my python virtual environment, `lib64/` is just a symlink to `lib/`.  Let this lesson hopefully save someone else hours of hand-wringing:  when re-labelling files with `semanage` and `restorecon`, make sure to use the absolute file name and not have any symbolic links anywhere in the path to the filename!

Ok, that out of the way we restart apache and try to access our site and we still get a 500.  Now in our error logs we see this:

    psycopg2.OperationalError: could not connect to server: Permission denied
    Is the server running on host "127.0.0.1" and accepting
    TCP/IP connections on port 5432?

There are a few things you should check here, first make sure postgres really is running and that you can connect to it from `psql -U stuff stuff`.  If that works then the problem is most likely the fact that since we are using TCP/IP to connect to our database server, this is also restricted by SELinux by default, until you set the following boolean allowing apache to open connections over TCP/IP---which includes the loopback interface to localhost:

```bash
sudo setsebool -P httpd_can_network_connect_db on
```

Now restart apache and you will, if you've followed the recipe to the letter, have django-stuff up and running in a very production-like environment.

There is another potential SELinux configuration problem that is worth mentioning here even though you will not encounter it by following this recipe.  It is probably the most common SELinux error encountered when working with apache.  It also happened to me in early development when I had unpacked my source code from a tarfile rather than using the `git clone` method described above.  You will also most definitely encounter this problem if the source code for your Django app is not in `/var/www`.

The first problem is that the source code of our web application does not have a file context that the httpd process is allowed to read.  Your indication that this is happening is that you will see the following AVC denials in the audit log, here formatted for legibility:

    AVC avc:  denied  { getattr } for  pid=3847 comm="httpd"
    path="/var/www/apps/stuff/site/config/wsgi.py"
    dev="sda1" ino=1705146
    scontext=system_u:system_r:httpd_t:s0
    tcontext=unconfined_u:object_r:default_t:s0
    tclass=file permissive

This tells us that the httpd process was denied access to the file `/var/www/apps/stuff/site/config/wsgi.py` because it has a file context of `default_t`.  Note that this is *not* a linux permissions problem!  By following this procedure, all the python files in our source tree will have permissions of 664.  They are owned by your user, with group of `webadmin`.  You can also verify that read and execute permissions are set for "other" for all parent directories of the source tree.  Thus, the apache user technically already has read permission to the file.  The solution is *not* to `chmod 777`.  DO NOT DO THIS!  I can't tell you how many Stack Overflow posts I've read along the lines of "Help, I gave apache ownership of the files and it still didn't work!"  "Then I did `chmod 777` and it still didn't work!"  And of course someone comes along and says "just diasble SELinux" and then "wow, thanks, it worked!"  This is a serious :facepalm: moment.  It makes me cringe thinking of how many web apps are out in the wild with world writable permissions on Document Root and SELinux disabled.

So it's not a linux permissions problem.  It's also not an apache configuration problem as long as you've given apache `Require all granted` access to the `wsgi.py` file in `httpd.conf`, as illustrated above.  When you see an AVC denial like this, the problem can only be fixed by assigning an appropriate SELinux file context to our source code to allow apache to read it.  The most appropriate file context in my opinion is `httpd_sys_content_t`.  So, let's change the file context for all files under our web application project directory and force a re-label:

```bash
sudo semanage fcontext -a -t httpd_sys_content_t /var/www/apps/stuff/site
sudo restorecon -v -R /var/www/apps/stuff/site
```

Wow, that was fun, right?  Our VM is setup to be very similar to an actual production environment so moving this to prod you can basically follow the same steps.  There are many additional production considerations I haven't addressed here that are important and for this you should definitely review the [Deployment Checklist](https://docs.djangoproject.com/en/1.10/howto/deployment/checklist/).

Now stop worrying about deployment and get back to writing some code!

