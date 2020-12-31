---
layout: post
title: Adventures with Flask
date: 2015-10-05
topics: web
---


Deployment of web applications can be a frustrating endeavor when trying to make the various pieces of a stack work together.  Development environments are typically setup with light weight test web servers and file-based databases to simplify debugging of application code during development.  This means that once your code is in good shape locally, you still face various challenges moving it from your workstation to a production server.  One of the pesky issues I always face when moving to production is getting the app to talk to the database.  To help verify that my production database configuration is working properly, I wrote a basic flask app, flask-db-test.  It's a simple app presenting a form which exposes a single database model, allowing you to see if reads and writes are working.

<!--excerpt-->

Deployment of web applications can be a frustrating endeavor when trying to make the various pieces of a stack work together.  Development environments are typically setup with lightweight test web servers and file-based databases to simplify debugging of application code.  This means that once your code is in good shape locally, you still face various challenges moving it from your workstation to a production server.

One of the pesky issues I always face when moving to production is getting the app to talk to the database.  To help verify that my production database configuration is working properly, I wrote a basic flask app, [flask-db-test](https://github.com/czep/flask-db-test).  It's a simple app presenting a form which exposes a single database model, allowing you to see if reads and writes are working.  In this post I will explain how the app works and describe the stack that I use for web development.

Even though the functionality of the flask-db-test app could be accomplished using a single python file, the project is organized using principles designed for large flask applications.  The typical single-file 'hello world' flask test apps may be useful for basic testing that your deployment stack is operational, but then you may find that other incongruities exist when trying to make your larger applications work.

Thus, one of the design goals of flask-db-test is to use patterns that one will find in larger flask applications.  Mainly, this entails organizing the project in multiple files, factoring logical groupings of application functionality into their own modules, using blueprints to attach the modules to the application at run time, dynamic population of configuration settings, and using a factory function to instantiate the application object.  Even though it's overkill for a simple test app, the reason for all this is so that the test app will more closely resemble larger apps that you intend to deploy, and by following these similar patterns and structure in the test app, you will (in theory) have an easier time getting your real apps working once the test app is working.

Now let's take a look at the stack I use for most of my projects.

## My stack:

* Deployment environment: EC2
* OS: CentOS
* Web server: Apache
* Scripting language: Python
* WSGI adapter: mod_wsgi
* Framework: Flask
* Database: PostgreSQL
* Database adapter: psycopg2
* ORM: SQLAlchemy
* Local development: OSX

Yeah I know all the cool kids are using nginx and green unicorn, but I lost my hipster license in an unfortunate altercation some years back at a juice bar when my neck beard got caught in someone's copy of _Gravity's Rainbow_.  Since then, [the elders of the internet](https://www.youtube.com/watch?v=iDbyYGrswtg) will only let me play with apache, aka `httpd`, the _Real_ hypertext transfer protocol daemon.  So save your asynchronous posturing for the playground---this stack is strictly for grown-ups.  Besides, my server doesn't need a [Supervisor](http://supervisord.org/) to change its diapers.

[Flask](http://flask.pocoo.org/) is an easy to use yet powerful micro-framework for building web applications in Python.  Flask's architecture is based on providing a very basic set of core features while allowing for plug-in extensions to provide additional features as the developer desires.  Thus, even though the current stable version has not been updated since July 2013, the ecosystem around Flask continues to be very active because developers can use popular extensions like [SQLAlchemy](https://pythonhosted.org/Flask-SQLAlchemy/) and [WTForms](https://flask-wtf.readthedocs.org/en/latest/) to extend the basic functionality of Flask.

Personally I find Flask a lot easier to work with compared to larger frameworks like Django which can be more opinionated about how certain functionality, such as the template engine and database ORM, needs to be implemented.  One reason I stick to Python for web apps, rather than the obvious choice of Ruby and Rails, is that I often need to work with machine learning pipelines or statistical data analysis and having easy access to [scikit-learn](http://scikit-learn.org/stable/), [numpy](http://www.numpy.org/), [scipy](http://www.scipy.org/), and [RPy](http://rpy.sourceforge.net/) is required.  Another reason is that while Flask is highly expressive, it isn't as magical as Rails.  Abstraction is a wonderful thing, but the distance with which Ruby shields you from what's actually going on can be frustrating.  When writing Ruby apps, I'm never quite sure what I'm doing, but with Flask I'm a lot more comfortable and can more readily see the reasoning behind why and where things need to go.

[PostgreSQL](http://www.postgresql.org/) is my first choice in databases.  Based on experience with all the major RDBMS platforms, PostgreSQL is the one I trust the most.  There are many technical reasons to choose Postgres over the other one, but these are well beyond the scope of this article and I don't want to descend too deeply into religious beliefs.  In any case, no matter what your choice of database, it is wise to avoid coupling your application to any proprietary extensions that would render your code non-portable.  Try to stick with ANSI SQL as closely as possible.  When it's time to optimize (which, if you're reading this, you haven't reached yet), then it does make sense to explore the unique features of your database system that may speed things up.  However, you should be prepared to have to switch database backends at some point, so make sure to code defensively and offer a functioning code path that will continue to work in a database agnostic environment.

I find [EC2](https://aws.amazon.com/ec2/) to be the best deployment option for quickly spinning up and testing new web apps.  Platforms like [Heroku](https://www.heroku.com/) can be attractive as they simplify a lot of operational headache (deployment, database connectivity, ssl), but this can increase pain later when needing to scale or migrate to dedicated hardware.  Every dependency you build into your app to save time and effort now can come back to haunt you later.  And the pain will be much greater when your'e balancing the demands of a growing user base alongside burgeoning technical debt.  Don't get me wrong, Platforms-as-a-Service like Heroku and the various other pieces of the Amazon stack can offer genuine benefits---if you know how to use them correctly and if they truly make sense with your architecture.

In 1999, I heard a Bon Mot along the lines of "Show me a website that won't run on a 400MHz Pentium and I'll show you a dead dot-com."  I think a similar saying could be true today, replacing "400mhz Pentium" with "EC2 t2.small instance".  My point is to be smart and start small and self-contained.  This provides you with the maximum flexibility for moving to larger instances or dedicated colocated servers, and gradually integrating third party services when the time is right.

My OS of choice is [CentOS](https://www.centos.org/).  Enterprise clients tend to like support contracts (at least the finance departments do!), and moving from CentOS to [RHEL](http://www.redhat.com/en/technologies/linux-platforms/enterprise-linux) is almost completely hassle-free.  There are a few things that irritate me, namely the horror show that is `systemd` and the fact that SELinux probably creates more problems than it solves, but on balance I prefer to do things the Red Hat way.  It's consistent, predictable, built for the enterprise, and rock-solid stable.  If not for RHEL, I would probably be happily using Slackware or FreeBSD, but of course I'd have to get that neck beard going again.

Now that my biases are out in the open, let me try to explain what I'm actually trying to accomplish here and hopefully be of help to others using the same or at least some parts of the stack I use.  It may be a surprise that I admit this, but I'm not really a good DBA!  I'm much more of a power *user* of databases, but I still need to do a lot of research every time I deploy a new database server.  One place where I always get tripped up is `pg_hba.conf`.  I'm sure I've read the documentation for every Postgres version dating back to 2002, but since setup is for me a relatively rare activity, it never seems to sink in.  I get it working, usually after trying a million different things without a rational scientific approach to what I'm doing, and then I have no idea how I actually got it to work in the first place!  

Another problem that arises is the big move from development box to production.  A lot of things are different when working on a local setup, even if it's a VM running the same OS as your production build.

So, I decided to create a basic test case and experiment with different connection settings until I finally figured out how it all works.  Thus, one of the primary purposes of flask-db-test is to provide a quick and easy test case which can swap in different database configurations with ease.

### We've come a long way from serving scripts out of cgi-bin.

Remember why web application frameworks evolved:  there's an awful lot of common boilerplate and recurring patterns that most web apps need to solve.  I still write cgi scripts from time to time for very basic one-off problems, but the minute they become the least bit complex I will find myself muttering, "wouldn't it be great if I could use a template here?" or "I sure hope nobody needs to make any changes to the database after I've hard-coded all this SQL."  But, in order to provide you with all this power, web frameworks force you to make some compromises, learn how they work, and invest some time into architecting your app rather than merely slapping together a script.  This is why it can be difficult to get all the pieces working together.

The purpose of deciding on a technology stack isn't merely to make friends on the internet and participate in flame wars.  The real reason to choose a stack and stick with it is to provide yourself with a consistent base that you understand in detail and on which you can quickly and confidently deploy your applications with a minimum of struggle.  The more you use your stack, the more you'll be able to recognize its shortcomings and begin to explore and evaluate specific alternatives when the time is right.

The Readme file for flask-db-test is terse but it does include all the steps necessary to successfully deploy the app on a fresh EC2 instance using the stack I've outlined above.  For the remainder of this article I will walk through all these steps and add some additional detail so you can see exactly why and how everything works.

## Install

So let's get started with a fresh EC2 instance running CentOS 7.  The link to the official [CentOS7 AMI is here](https://aws.amazon.com/marketplace/pp/B00O7WM7QW).  Make sure your Security Group allows inbound ssh from your development workstation's IP address and inbound and outbound http traffic to and from everywhere.  After connecting to your instance for the first time, the very first thing you want to do is run an update.  Also, get `vim` or another editor of your choice.

```bash
sudo yum -y update
sudo yum install vim
```

Next, create a user account unless you're happy being known generically as 'centos'.  Also add yourself to these groups so you can have sudo privileges, and setup your ssh key.

```bash
sudo useradd coolnamebro
sudo passwd coolnamebro
sudo usermod -G adm,wheel,systemd-journal -a coolnamebro
sudo -u coolnamebro mkdir -p /home/coolnamebro/.ssh
sudo cp /home/centos/.ssh/authorized_keys /home/coolnamebro/.ssh
sudo chmod 700 /home/coolnamebro/.ssh
sudo chown coolnamebro:coolnamebro /home/coolnamebro/.ssh/authorized_keys
```

To make directory listings a little prettier and provide some quick shortcuts to frequently used commands, I always drop the following lines into `/etc/profile.d/colorls.sh`.

```bash
# sudo vim /etc/profile.d/colorls.sh
alias l='ls -alh --color=auto' 2>/dev/null
alias la='ls -al --color=auto' 2>/dev/null
alias ls='ls --color=auto' 2>/dev/null
alias p='ps aux'
alias t='top'
```

Now, let's get apache working.  We will need the following packages to get started.  We will need gcc to compile the psycopg2 adapter later, so we will go ahead and install the development group as well.

```bash
sudo yum install httpd python python-devel python-virtualenv httpd-devel mod_wsgi
sudo yum groupinstall development
```

Next we are going to prepare the `/var/www` directory.  We will add two directories:  `wsgi-scripts` will be the entry point for all our mod_wsgi applications.  The `apps` directory will contain all of our application code.  We will also create a new group `www`, to which we will add ourselves and any other users who will need to administer the site.

```bash
sudo mkdir /var/www/{wsgi-scripts,apps}

# setup webserver admin group and directories
sudo groupadd www
sudo usermod -a -G www coolnamebro
sudo chown -R root:www /var/www
sudo chmod 2775 /var/www
find /var/www -type d -exec sudo chmod 2775 {} +
find /var/www -type f -exec sudo chmod 0664 {} +
```

The last two commands ensure that new directories and files created under `/var/www` will inherit the proper permissions.  Logout and login again to pickup the new group membership.  Apache configuration can be a complicated beast; however, fortunately, the default install is relatively sane.  I urge you to [read the documentation](http://httpd.apache.org/docs/2.4/) to familiarize yourself with the configuration files and the various options you have as a web server administrator.  Consider removing unnecessary modules (of which there are many).  But for now, we are just going to do the bare minimum to get our test app working.  This means enabling mod_wsgi and adding the necessary directives for apache to serve our flask apps.

Apache 2.4 ships with three MPMs (Multi-Processing Modules) which control how the server handles connections.  By default it will use the trusty 'prefork' MPM but you may want to consider one of the newer options, 'worker' or 'event' (especially if you catch any flak from your nginx friends).  We will stick to prefork for our test, which means that Apache will handle each new connection request with a dedicated child process.  In addition, mod_wsgi has two possible modes of operation:  embedded mode and daemon mode.  In embedded mode, the Python sub-interpreter handling your application is embedded as part of the Apache process (or thread) handling the connection.  Embedded mode requires the least amount of configuration but will be relatively heavy on system resources, particularly memory, especially if used in combination with apache prefork.  To scale, you should consider running in daemon mode.  The choice is up to you and it only requires two additional directive in `httpd.conf`.  For reference, the [mod_wsgi documentation](https://code.google.com/p/modwsgi/) is extremely well written and thorough.

```bash
sudo vim /etc/httpd/conf/httpd.conf

# add these lines at the end of the file
WSGIScriptAlias /flasktest /var/www/wsgi-scripts/flask-db-test.wsgi

<Directory /var/www/wsgi-scripts>
    Require all granted
</Directory>
```

Run `apachectl configtest` after making changes to your `httpd.conf` file to validate that you didn't inadvertently bork anything.  Then fire up Apache and visit your public IP address to make sure you see the default Welcome page.  You will probably also want to enable apache to run at system boot.

```bash
sudo systemctl start httpd
sudo systemctl enable httpd
```

At this point we could proceed to installing flask-db-test but because I've made `psycopg2` one of the dependencies, we will need to install Postgres first.  (If you don't want to bother with Postgres and would rather run the test using SQLite instead, you can skip this section and edit `requirements.txt` to remove the dependency: `psycopg2==2.6.1`).

### PostgreSQL

Installing Postgres on Centos or any RHEL derivative is a breeze.  The first step is to exclude postgres from the default yum repositories.

```bash
sudo vim /etc/yum.repos.d/CentOS-Base.repo
# add this line to the end of both the [base] and [updates] sections:
exclude=postgresql*
```

Now, we will install the Postgres repo so that when we use yum, it will pick up the latest and greatest rather than the older version in the default repo.  For more information, and to ensure you are using the latest url, please see [these instructions](https://wiki.postgresql.org/wiki/YUM_Installation).

```bash
sudo yum localinstall http://yum.postgresql.org/9.4/redhat/rhel-7-x86_64/pgdg-centos94-9.4-1.noarch.rpm
```

Take a look at what packages are available:

```bash
yum list postgres*
```

Next, we will install the core packages that are needed.

```bash
sudo yum install postgresql94.x86_64 \
                     postgresql94-contrib.x86_64 \
                     postgresql94-libs.x86_64 \
                     postgresql94-odbc.x86_64 \
                     postgresql94-server.x86_64 \
                     postgresql94-test.x86_64 \
                     postgresql94-debuginfo.x86_64
```

Initialize Postgres with the following command.  After that completes, start up the server and also enable it to launch at boot time:

```bash
sudo /usr/pgsql-9.4/bin/postgresql94-setup initdb
sudo systemctl start postgresql-9.4
sudo systemctl enable postgresql-9.4.service
```

And now for the dreaded `pg_hba.conf`.  This file controls how Postgres will evaluate whether to allow connections from clients.  On our default install, you should see the following lines at the end of the file:

```bash
# "local" is for Unix domain socket connections only
local   all             all                                     peer
# IPv4 local connections:
host    all             all             127.0.0.1/32            ident
# IPv6 local connections:
host    all             all             ::1/128                 ident
```

The first line handles any connections occurring over unix sockets and the latter two are for TCP/IP connections.  The authentication methods 'peer' and 'ident' mean that Postgres will lookup the operating system user id belonging to the connection and allow the connetion to occur if there is a postgres user with the same name.  Since our default install only has one user, postgres, the only way to currently connect to the database is to open a shell as the postgres user.  If we were to create a new postgres user with a name matching our operating system username, then we could connect to any database on the server.  Our web application will be connecting to postgres using the same user that apache child processes will run as, which by default is 'apache'.  So, we could add a new postgres user named apache and be on our way.  This is not advisable, however, because it will allow any code that apache runs to connect to any database.  What we should really do is create a user specifically for our app, and only allow it to connect to a database that it owns.  You can read all about how this works in the chapter on [Client Authentication](http://www.postgresql.org/docs/9.4/interactive/client-authentication.html) in the Postgres manual.

To accomplish this, edit `pg_hba.conf` and add the following line *above* the first 'local' entry.  We need to put this first or else our connection attempts will be matched by the default line, which will fail since we have no operating system user named 'flasktest'.

```bash
# sudo vim /var/lib/pgsql/9.4/data/pg_hba.conf

local   flasktestdb     flasktest   md5
```

This requires md5-hashed passwords be used for local connections (unix domain sockets) to the database named 'flasktestdb' for user 'flasktest'.

After making this change you'll need to restart postgres.

```bash
sudo systemctl restart postgresql-9.4
```

Now we have to create the postgres user and database that our web app will use.  Since the only way we can connect to the database is from a shell owned by user postgres, we will first need to open a root shell, then use sudo to open a psql client as user postgres. 

```bash
sudo /bin/bash
sudo -u postgres psql
```

Now we can issue the two SQL commands below to create the user (role) and database for our test app.

```sql
create role flasktest with login encrypted password 'test12345';
create database flasktestdb with owner flasktest;
```

Use `\q` to exit the psql client and `exit` to return to your normal shell---don't go running around as root for too long!

To fix an issue that will come up when installing `psycopg2`, you'll need to create a symlink to `pg_config` so the python installer will know where to find it.

```bash
sudo ln -s /usr/pgsql-9.4/bin/pg_config /usr/local/bin/pg_config
```

### flask-db-test

Now we can actually install our test app.  First, install git so you can clone the repository:

```bash
sudo yum install git
```

Now, enter the `/var/www/apps` directory and clone the flask-db-test project.  We will move the packaged wsgi script to our `wsgi-scripts` directory, create and activate a virtual environment for our python interpreter, and then install the python packages necessary for our flask application to work.

```bash
cd /var/www/apps
git clone https://github.com/czep/flask-db-test.git
cd flask-db-test
mv flask-db-test.wsgi ../../wsgi-scripts
virtualenv venv
source venv/bin/activate
pip install -r requirements.txt
```

If you get a permission denied error when running `git clone`, make sure you logged out and back in so that your membership in the `www` group is known by the shell.  If you get an error message saying "Error: pg_config executable not found", see the above section on creating a symlink for pg_config.  If you get an error saying "unable to execute gcc: No such file or directory", make sure you've installed gcc using the yum command from earlier.

## Usage - SQLite

To use flask-db-test, edit or add new configurations files in the `local` directory.  To activate a config, create a symlink from config_live.py pointing to the desired config file.  We will start with our sqlite config.

```bash
ln -s local/config_sqlite.py config_live.py
```

Ensure your virtual environment is still active---your shell prompt should be prefaced with "(venv)".  We first need to initialize the database using the following command:

```bash
python manage.py init_database
```

If all goes well, you will see the file `flask-db-test.db` in the flask-db-test directory.  If you connect to it in sqlite, you'll see an empty table called 'stuff':

```bash
sqlite3 flask-db-test.db
.tables
.schema stuff
```

However, there are a few things wrong with the file as is, and a few frustratingly sub-optimal things we need to do to get it to work.  Frankly, sqlite should not be used for production in a web app.  Single-user, embedded systems fine, but not a multi-user web site.  So, I'm not terribly concerned with getting this to work in a production worthy manner.  The main issues surround the permissions model and SELinux.  Since you created it with a script running as your user, it will be owned by you, and is going to have permissions of 644.  We really need the apache user to be able to write to this file.  In addition, we need apache to be able to write to files in the flask-db-test directory and we will need to alter some SELinux labels in order to allow apache to write to the database file.  First, 

```bash
sudo chown apache app-dev.db
sudo usermod -a -G www apache
```

Next, SELinux.  I admit I have no interest in figuring out the proper contexts because I'm never going to be using sqlite in production like this.  So to get this to work, just set selinux to permissive mode.  But, promise me that you will set it back to enforcing after this test is done.  I hate to be yet another "just turn off SELinux" guy, but yeah, just turn off SELinux and it will work.  

Now, restart apache (or if using daemon mode, touch the wsgi script).

```bash
# mod_wsgi in embedded mode
sudo systemctl restart httpd

# mod_wsgi in daemon mode
touch ../../wsgi-scripts/flask-db-test.wsgi
```

Now turn SELinux back on before I 0wn your server.

## Usage - Postgres

Let's try activating the configuration for using Postgres as the database backend.  First, edit the file `local/config_postgres.py` and entering the proper credentials in the environment variable for SQLAlchemy.

```python
SQLALCHEMY_DATABASE_URI = 'postgresql+psycopg2://flasktest:test12345@/flasktestdb'
```

Delete the symlink and remap it to point to the postgres config file, then initialize the database.

```bash
rm config_live.py
ln -s local/config_postgres.py config_live.py
python manage.py init_database
```

Go back to a root shell and connect using psql to the flasktest database:

```bash
sudo /bin/bash
sudo -u postgres psql flasktestdb
```

You should now be able to see a table called 'stuff' in the default list of relations.  Check it out:

```sql
\dt
\d stuff
```

Before continuing, we have a couple of SELinux commands to fix so that apache can talk to psycopg2:

```bash
sudo semanage fcontext -a -t httpd_sys_script_exec_t /var/www/apps/flask-db-test/venv/lib/python2.7/site-packages/psycopg2/_psycopg.so
sudo restorecon -v /var/www/apps/flask-db-test/venv/lib/python2.7/site-packages/psycopg2/_psycopg.so
```


Restart apache, and visit the site again.  Bask in the glory of the goodness!













