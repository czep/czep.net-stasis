---
layout: post
title: Svelte Apache
date: 2016-03-05
topics: web
---

The agenda for this post is to strip down an apache install to the minimal configuration needed to feasibly run the server.  We'll make it slender and elegant, in a word---svelte.  This can serve as a starting point for incrementally adding functionality as it is required for your particular installation.  We will also turn on some monitoring modules to provide some helpful diagnostics about a running apache server.  In addition, we will install a python script modeled on php's phpinfo() function to quickly show a lot of detail about the environment in which apache is running.  Finally, since all the things should be encrypted these days, we will set ourselves up with a certificate courtesy of [Let's Encrypt](https://letsencrypt.org/) which will allow us to serve our site on https and be accepted by modern browsers.

<!--excerpt-->

You've just used your distribution's package manager to install httpd, now what?  You may be eager to start cp'ing your html files to $DOCUMENT_ROOT, but before you jump right in, shouldn't you take a look at the configuration file first?

Why bother, right?  I mean, that's why we're using a distribution's package in the first place!  If you can't trust upstream to provide sensible defaults, then who can you trust?  Fortunately, this is largely true:  modern default apache configurations do in fact provide sane defaults that are secure, offer a great deal of functionality, and will be relatively decently performant for your typical small- or medium-sized website.  I've launched more than a few websites for clients with a default apache config that I didn't even bother to inspect until many months (and many users) farther down the road.  But defaults are rarely the most optimal, and spending some time tuning apache to your workload can have dramatic effects on performance which will be readily noticed by users.  

In addition to performance, there are also very important security concerns for which you should know the details of how your webserver is configured.  While the default apache install is generally security-conscious and will protect you from some particularly gnarly dangers (for example, running the webserver as an unprivileged user, preventing .htaccess files from being served to clients, forbidding access to the root filesystem), there is definitely a bias in favor of opening up a lot of functionality by default---certainly much more than you will need right out of the gate.  This vastly increases the footprint of potential exploits.  It is preferable from a security standpoint to turn off any feature that you are not using.  This can also benefit performance by reducing the amount of memory that the webserver process needs to consume as well as making the server faster by reducing the amount of code it needs to run.

The agenda for this post is to strip down an apache install to the minimal configuration needed to feasibly run the server.  We'll make it slender and elegant, in a word---svelte.  This can serve as a starting point for incrementally adding functionality as it is required for your particular installation.  We will also turn on some monitoring modules to provide some helpful diagnostics about a running apache server.  In addition, we will install a python script modeled on php's `phpinfo()` function to quickly show a lot of detail about the environment in which apache is running.  Finally, since all the things should be encrypted these days, we will set ourselves up with a certificate courtesy of [Let's Encrypt](https://letsencrypt.org/) which will allow us to serve our site on https and be accepted by modern browsers.  Our first step is take a look at the default install to make sure that a) the web server is actually working, and b) we know where the configuration files are kept.

## The typical default apache config

If you're compiling and installing apache from source, the default ServerRoot is `/usr/local/apache2`, although this can easily be changed with arguments to the configure script.  For a comprehensive reference of various default locations for different distributions, see the wiki page [DistrosDefaultLayout](http://wiki.apache.org/httpd/DistrosDefaultLayout).  In the RedHat family of distributions, the `ServerRoot` directory will be `/etc/httpd` and this is where all the configuration files will be located if you installed with `yum install httpd` or `dnf install httpd`.  Let's take a look at where everything is:

```bash
$ ls -Alh /etc/httpd
total 12K
drwxr-xr-x.  2 root root 4.0K Mar 22 15:18 conf
drwxr-xr-x.  2 root root 4.0K Mar 22 15:18 conf.d
drwxr-xr-x.  2 root root 4.0K Mar 22 15:18 conf.modules.d
lrwxrwxrwx.  1 root root   19 Jan  4 08:16 logs -> ../../var/log/httpd
lrwxrwxrwx.  1 root root   29 Jan  4 08:16 modules -> ../../usr/lib64/httpd/modules
lrwxrwxrwx.  1 root root   10 Jan  4 08:16 run -> /run/httpd

$ ls -Alh /etc/httpd/conf
total 28K
-rw-r--r--. 1 root root  12K Jan  4 08:12 httpd.conf
-rw-r--r--. 1 root root  13K Jan  4 08:16 magic

$ ls -Alh /etc/httpd/conf.d
total 28K
-rw-r--r--. 1 root root 2.9K Jan  4 08:15 autoindex.conf
-rw-r--r--. 1 root root  366 Jan  4 08:25 README
-rw-r--r--. 1 root root 9.2K Jan  4 08:12 ssl.conf
-rw-r--r--. 1 root root 1.3K Jan  4 08:12 userdir.conf
-rw-r--r--. 1 root root  516 Jan  4 08:12 welcome.conf

$ ls -Alh /etc/httpd/conf.modules.d
total 40K
-rw-r--r--. 1 root root 3.2K Jan  4 08:12 00-base.conf
-rw-r--r--. 1 root root  139 Jan  4 08:12 00-dav.conf
-rw-r--r--. 1 root root   41 Jan  4 08:12 00-lua.conf
-rw-r--r--. 1 root root  742 Jan  4 08:12 00-mpm.conf
-rw-r--r--. 1 root root  839 Jan  4 08:12 00-optional.conf
-rw-r--r--. 1 root root  957 Jan  4 08:12 00-proxy.conf
-rw-r--r--. 1 root root   41 Jan  4 08:12 00-ssl.conf
-rw-r--r--. 1 root root   88 Jan  4 08:12 00-systemd.conf
-rw-r--r--. 1 root root  451 Jan  4 08:12 01-cgi.conf
-rw-r--r--. 1 root root  418 Jan  4 08:16 README
```

The purpose of all these conf files will become clear once we take a look at the main httpd.conf file.  Unless you installed apache from source, you won't know how the binary was actually compiled.  An easy way to inspect the compiled binary itself is with the `-V` command line argument.  This prints several bits of useful information:


    $ httpd -V
    AH00558: httpd: Could not reliably determine the server's fully qualified domain name, using fe80::38:d8ff:fe2a:723d. Set the 'ServerName' directive globally to suppress this message
    Server version: Apache/2.4.18 (Fedora)
    Server built:   Jan  4 2016 08:15:18
    Server's Module Magic Number: 20120211:52
    Server loaded:  APR 1.5.2, APR-UTIL 1.5.4
    Compiled using: APR 1.5.2, APR-UTIL 1.5.4
    Architecture:   64-bit
    Server MPM:     prefork
      threaded:     no
        forked:     yes (variable process count)
    Server compiled with....
     -D APR_HAS_SENDFILE
     -D APR_HAS_MMAP
     -D APR_HAVE_IPV6 (IPv4-mapped addresses enabled)
     -D APR_USE_SYSVSEM_SERIALIZE
     -D APR_USE_PTHREAD_SERIALIZE
     -D SINGLE_LISTEN_UNSERIALIZED_ACCEPT
     -D APR_HAS_OTHER_CHILD
     -D AP_HAVE_RELIABLE_PIPED_LOGS
     -D DYNAMIC_MODULE_LIMIT=256
     -D HTTPD_ROOT="/etc/httpd"
     -D SUEXEC_BIN="/usr/sbin/suexec"
     -D DEFAULT_PIDLOG="/run/httpd/httpd.pid"
     -D DEFAULT_SCOREBOARD="logs/apache_runtime_status"
     -D DEFAULT_ERRORLOG="logs/error_log"
     -D AP_TYPES_CONFIG_FILE="conf/mime.types"
     -D SERVER_CONFIG_FILE="conf/httpd.conf"


As you can see from the output, the version of apache we are using is 2.4.18 which happens to be the latest stable release at the time of this writing, and that we are running Fedora.  All the compilation options are listed here so we can see which static modules were compiled into the binary.  We can also verify that the ServerRoot directory is in fact `/etc/httpd` and the configuration file can be found in `conf/httpd.conf`.  Note that we are running the 'prefork' MPM.  Also note the warning that the FQDN couldn't be detected which will likely be the case if you are running on a VPS.  This can be handled by explicitly specifying the 'ServerName' directive in the configuration.

Now that we know where to find the configuration file, the next step is to open it up along with a browser window pointing to the [documentation](http://httpd.apache.org/docs/2.4/), and start exploring what the defaults are and what we may want to change.  On RedHat systems, the apache configuration file is organized in the following way:  first, all the .conf files in the `conf.modules.d` directory are read.  The purpose of these files is simply to include various 'LoadModule' statements.  Then, in the body of httpd.conf, several critical configuration directives are made as well as entries that will need to be customized for a particular installation.  Lastly, all the .conf files in the `conf.d` directory are read.  This is where module-specific directives are set.  Note that this is only one way of organizing the configuration.  If you prefer, you can choose an alternate style that suits your tastes.  My preference is to keep everything in one file for simplicity.

Before mucking about with the configuration files, we can go ahead and start the server with the defaults intact to verify that the server does in fact start and is able to serve pages.  Run `apachectl start` to get up and running.  If this command gives you trouble, consult the documentation supplied by your distribution's vendor to determine how they recommend starting and stopping apache.

Check out `ps aux|grep httpd` to make sure you see the httpd processes running.

```bash
$ ps aux|grep httpd
root      7584  0.5  0.6 273804 12700 ?        Ss   22:24   0:00 /usr/sbin/httpd -DFOREGROUND
apache    7586  0.0  0.3 282000  8080 ?        Sl   22:24   0:00 /usr/sbin/httpd -DFOREGROUND
apache    7587  0.0  0.3 282000  8080 ?        Sl   22:24   0:00 /usr/sbin/httpd -DFOREGROUND
apache    7588  0.0  0.3 282000  8080 ?        Sl   22:24   0:00 /usr/sbin/httpd -DFOREGROUND
apache    7589  0.0  0.3 282000  8080 ?        Sl   22:24   0:00 /usr/sbin/httpd -DFOREGROUND
apache    7590  0.0  0.3 282000  8080 ?        Sl   22:24   0:00 /usr/sbin/httpd -DFOREGROUND
```

Note that we have one process owned by root and 5 processes running under the user 'apache'.  We are running under the 'prefork' MPM so the first process---the parent process run by root---is responsible for binding to port 80 and delegating requests as they come in to an available child process run by the unpriveleged user 'apache'.  For the prefork MPM, the default values of the 'StartServers' and 'MinSpareServers' directives are 5, which is why we see 5 child processes immediately after starting a server that is not yet receiving any traffic.

You can also verify that the server is operational by running `apachectl status`.  

    # apachectl status
    ● httpd.service - The Apache HTTP Server
       Loaded: loaded (/usr/lib/systemd/system/httpd.service; enabled; vendor preset: disabled)
       Active: active (running) since Sat 2016-03-05 22:24:14 UTC; 4min 42s ago
     Main PID: 7584 (httpd)
       Status: "Total requests: 0; Idle/Busy workers 100/0;Requests/sec: 0; Bytes served/sec:   0 B/sec"
       CGroup: /system.slice/httpd.service
               ├─7584 /usr/sbin/httpd -DFOREGROUND
               ├─7586 /usr/sbin/httpd -DFOREGROUND
               ├─7587 /usr/sbin/httpd -DFOREGROUND
               ├─7588 /usr/sbin/httpd -DFOREGROUND
               ├─7589 /usr/sbin/httpd -DFOREGROUND
               └─7590 /usr/sbin/httpd -DFOREGROUND

    Mar 05 22:24:14 spinoza systemd[1]: Starting The Apache HTTP Server...
    Mar 05 22:24:14 spinoza httpd[7584]: AH00558: httpd: Could not reliably determine the server's fully qualified domain name, using fe80::38:d8ff:fe2a:723d. Set the 'ServerName' directive ...s this message
    Mar 05 22:24:14 spinoza systemd[1]: Started The Apache HTTP Server.

Run `curl http://localhost/` from your server and you should see the text of the welcome page (see `conf.d/welcome.conf` for details).  Now try accessing the server from your desktop to make sure that pages are making their way out of the firewall.  If everything checks out, we can now start with the mucking around.

## Base minimal apache config

All told, the default configuration will attempt to load 84 modules.  It is *highly* unlikely you need all that functionality and leaving it in there will just bloat your server while opening up potential security risks.  The documentation for [Performance Tuning](https://httpd.apache.org/docs/2.4/misc/perf-tuning.html) says there are only three modules that are realistically necessary for the server to operate:  mod_mime, mod_dir, and mod_log_config.  Let's start with these three modules, some of the basic required directives, and some additional directives we should specify at the outset based on the guidelines in Apache's [Security Tips](https://httpd.apache.org/docs/2.4/misc/security_tips.html).

```apache
###
### httpd.conf for apache 2.4.x (RedHat systems)
###

### Main server configuration
ServerRoot "/etc/httpd"
Listen 80
ServerAdmin webmaster@example.net
ServerName example.net:80
```

We start our httpd.conf file with these four directives to provide the server with some essential identifying information critical to its operation.  First, the [`ServerRoot`](https://httpd.apache.org/docs/2.4/mod/core.html#serverroot) directive should specify the same directory that was compiled into the binary with the `-D HTTPD_ROOT` flag.  Next, we need to tell apache which interface and port to [`Listen`](https://httpd.apache.org/docs/2.4/mod/mpm_common.html#listen) on which by default will be port 80 on all IP interfaces.  If for some reason (firewall rules that block port 80, another server already running on port 80, or you don't have root privileges necessary to access ports below 1000), you can specify a different port here (8000 or 8080 are frequently used), but then the url to access your site will also need to include the port number as in http://example.net:8000/.  The [`ServerAdmin`](https://httpd.apache.org/docs/2.4/mod/core.html#serveradmin) directive is used to include an email address shown to clients when errors occur.  The [`ServerName`](https://httpd.apache.org/docs/2.4/mod/core.html#servername) tells apache how to identify itself.  Setting this will prevent the "Could not reliably determine the server's fully qualified domain name" warning message at startup.  Next, we include our base set of modules and select an MPM.

```apache
### Base set of modules
LoadModule mime_module modules/mod_mime.so
LoadModule dir_module modules/mod_dir.so
LoadModule log_config_module modules/mod_log_config.so

# Pick one MPM module
LoadModule mpm_prefork_module modules/mod_mpm_prefork.so
#LoadModule mpm_worker_module modules/mod_mpm_worker.so
#LoadModule mpm_event_module modules/mod_mpm_event.so
 
```

In apache 2.4 there are three possible [Multi-Processing Modules](https://httpd.apache.org/docs/2.4/mpm.html) and you will need to load one---and only one---of them in your httpd.conf.  The [prefork](https://httpd.apache.org/docs/2.4/mod/prefork.html) module is the traditional way in which apache operates and is still recommended for low-traffic sites or when using any additional modules that are not thread-safe (PHP for instance).  In prefork, the server initially starts under the root user in order to bind to port 80.  Then the server will start several additional child processes under a less-privileged user (assuming you have properly set the 'User' directive).  The parent process will then delegate incoming requests to an available child process.  Each child process can only handle one request at a time.  This can be problematic for sites with a lot of simultaneous requests, but it is often necessary when using code that cannot run in a multi-threaded environment.  It also provides a bit more stability since any fatal errors that may occur while servicing a request leading to the process being killed, will not affect any other requests.

The [worker](https://httpd.apache.org/docs/2.4/mod/worker.html) MPM was introduced in apache 2.0 in an effort to improve the performance of high-traffic servers.  Forking child processes to handle individual requests is expensive both in terms of memory and computational cycles.  Apache uses *a lot* of memory.  Using the default configuration on my server, each child process uses around 9.5 MB (this is Resident Set Size, not virtual memory!)  Creating a process is also an expensive task for the operating system and with a site already under heavy load, waiting for the OS to fork additional child processes can greatly increase the burden on the CPU and thus impact site response times.  The worker MPM is designed to alleviate these pressures.  As with prefork, a parent process owned by root will create multiple child processes to handle requests.  The key difference is that the child processes in the worker MPM will allocate a set number of threads each of which can handle its own request.  This greatly increases the throughput of a highly loaded server.  Since thread creation is a lot less expensive than process creation, it also decreases the load on the CPU when requests begin to outpace the number of available workers.  There is a slight impact on memory since each thread will need its own private stack, but this is generally outweighed by the ability to handle requests using light-weight threads rather than heavy-weight processes.

The [event](https://httpd.apache.org/docs/2.4/mod/event.html) MPM was added in version 2.2 and is a fancier version of the worker MPM designed to handle compromises introduced by [KeepAlive](https://en.wikipedia.org/wiki/HTTP_persistent_connection) requests.  In general, if you expect multiple requests from the same client in a relatively short period of time, then you will want to enable KeepAlive.  This can happen if you have a lot of static assets being loaded with a page view (images, css, javascript, or other static files), or if users will typically click around frequently, if you have a very interactive site, or if your site will generate a lot of backend ajax requests.  KeepAlive allows subsequent requests arriving from the same client within a timeout period to reuse an already established TCP connection.  Without KeepAlive, each request will need to establish a new TCP connection.  Since this requires three network hops from client to server (SYN, SYN-ACK, ACK), the overhead of doing this repeatedly for each request made by the client can quickly degrade performance.  

The problem with supporting KeepAlive requests happens when under heavy load the bottleneck moves from the server to the network stack.  When a worker thread has data to send to a client and the network link is saturated, it will be blocked until the OS signals that it is ready to send data onto the network.  While the thread is blocked, it can't do anything else.  This can result in a situation where a large number of worker threads are blocked and idly waiting for the network to become available.  The event MPM is a derivative of the worker MPM except that each process includes a special thread whose sole purpose is to handle I/O coordination with the OS.  Thus, anytime a worker is sending data and gets blocked, it signals this special thread which then takes over and will handle sending the remaining data to the client.  Meanwhile, the original thread can now move on to handle a new incoming request.  Wow, cool stuff, eh?

The choice of which MPM to use needs to be made based on the type of site you are running, and the characteristics of the traffic you get.  For the purpose of this base minimal config, we will stick with the prefork MPM as the default.  Now, there are a few more directives we need to specify in our config before we can switch it on.

```apache
User apache
Group apache
DocumentRoot "/var/www/html"
DirectoryIndex index.html
```

With the [`User`](https://httpd.apache.org/docs/2.4/mod/mod_unixd.html#user) and [`Group`](https://httpd.apache.org/docs/2.4/mod/mod_unixd.html#group) directives, we specify the credentials under which the child processes that handle requests will be run.  This should *not* be root, nor should it be a standard unix user account or other administrative user account.  The whole purpose is to run the child processes with the minimum level of privileges necessary to serve the site, and nothing more.  If you installed apache from a distribution's package manager, the install process will likely have already created the user and group accounts.  If you install from source, you may need to create them yourself.  When doing so, make sure that the apache user cannot login as an ordinary user (does not have a shell, a password, or a home directory).  The [`DocumentRoot`](https://httpd.apache.org/docs/2.4/mod/core.html#documentroot) directory indicates where the public html files reside---in other words, which directory on the file system maps to the root directory of the web server (where 'index.html' will reside when requesting http://example.net/index.html).  Next, the [`DirectoryIndex`](https://httpd.apache.org/docs/2.4/mod/mod_dir.html#directoryindex) directive tells apache which filenames to search for when a request is made ending with a trailing slash.  For security and simplicity, we only allow 'index.html' to be served in response to such requests.  

Next, we setup some directives to secure our web root and control what files the web server does and does not have access to, what files should and should not be served back to clients.

```apache
# Default deny access to root filesystem
<Directory />
    AllowOverride none
    Require all denied
</Directory>

# Configure access to the server's root directory
<Directory "/var/www">
    AllowOverride None
    Require all granted
</Directory>

<Directory "/var/www/html">
    Options FollowSymLinks
    AllowOverride None
    Require all granted
</Directory>

# Prevent viewing of .htaccess and .htpasswd files
<Files ".ht*">
    Require all denied
</Files>
 
```

Note that the access control directives changed substantially from apache 2.2 to 2.4.  In 2.4, we use the [`Require`](https://httpd.apache.org/docs/2.4/mod/mod_authz_core.html#require) directive to handle filesystem access control.  Our strategy here is to first set a default policy to deny access to the entire filesystem, then only grant access to apache where it is needed.  We do this within three separate [`Directory`](https://httpd.apache.org/docs/2.4/mod/core.html#directory) directives.   The first one will set our default policy to deny access to '/', the root filesystem.  It is important to distinguish this from the 'DocumentRoot' directory.  Directory contexts are created as absolute pathnames, they are not relative to the DocumentRoot.  In this first Directory directive, we use [`AllowOverride none`](https://httpd.apache.org/docs/2.4/mod/core.html#allowoverride) to prevent .htaccess files from making any changes to these default settings, and then [`Require all denied`](https://httpd.apache.org/docs/2.4/mod/mod_authz_core.html#require) which unconditionally denies access to the specified resource.  

Next, we allow access to the server's root directory, which is `/var/www` on our Fedora system.  This is the parent of the DocumentRoot directory, and apache will need to be able to read files here in order to do its job.  We do the same with DocumentRoot, `/var/www/html`, but we also include the [`Options FollowSymLinks`](https://httpd.apache.org/docs/2.4/mod/core.html#options) directive to allow the server to traverse symbolically linked files.  Any directory which doesn't contain an 'index.html' file, when requested without a trailing slash will result in a 404 error.  If you'd like to show a directory listing instead, change this to `Options Indexes FollowSymLinks` and make sure you also load the [mod_autoindex](http://httpd.apache.org/docs/2.4/mod/mod_autoindex.html) module.  Lastly, we deny access to any .ht* files.  The .htaccess and .htpasswd files can be useful in shared hosting environments where users need to make some configuration customizations without having access to the global server config.  It is advised that you do not enable this functionality unless and until you actually need it.

Continuing with our base minimal config, let's setup logging for the server.

```apache
# Logging
ErrorLog "logs/error_log"
LogLevel info 
LogFormat "%h %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-Agent}i\"" combined
CustomLog "logs/access_log" combined
```

This is all standard stuff.  There are a lot of options for how access and error logs are controlled.  For more info, check out the documention for [mod_log_config](https://httpd.apache.org/docs/2.4/mod/mod_log_config.html).  

```apache
# Mime types
TypesConfig /etc/mime.types
AddType application/x-compress .Z
AddType application/x-gzip .gz .tgz

# Misc
AddDefaultCharset UTF-8
EnableSendfile on
```

The [`TypesConfig`](http://httpd.apache.org/docs/2.4/mod/mod_mime.html#typesconfig) and [`AddType`](http://httpd.apache.org/docs/2.4/mod/mod_mime.html#addtype) directives are necessary to inform apache about how to handle different file types.  Next, we use the [`AddDefaultCharset`](http://httpd.apache.org/docs/2.4/mod/core.html#adddefaultcharset) directive to indicate that we expect text files to be UTF-8 encoded.  This should be the standard for a modern server.  Lastly, we turn on [`EnableSendfile`](http://httpd.apache.org/docs/2.4/mod/core.html#enablesendfile).  You may need to verify that your OS can support sendfile, which is likely the case if it's a modern linux/unix.  This is a performance optimization that is worth enabling in our base minimal config because it can really lessen the load on the server by removing the need to open a file and read it before sending it to the client.  Without sendfile, anytime a request is made, apache will need to stat the file to make sure it exists, then it will make a system call to the operating system to open the file, read it, store its contents in memory, then ask the OS to send it onto the network interface and out to the client.  There's a lot of redundancy here.  With sendfile enabled, apache simply tells the OS, "hey, this file here needs to be sent on the network to that client over there."  

Now let's try out our base minimal httpd.conf by running `apachectl configtest`.  The first thing we'll see is an error message indicating that use of the 'User' directive requires the [mod_unixd](http://httpd.apache.org/docs/2.4/mod/mod_unixd.html) module.  So we will need to add that to the list of modules to load.

```apache
LoadModule unixd_module modules/mod_unixd.so
```

Trying again we will find another error message telling us that the 'Require' directive needs [mod_authz_core](http://httpd.apache.org/docs/2.4/mod/mod_authz_core.html) loaded.  No problem, we'll quickly take care of that one too.

```apache
LoadModule authz_core_module modules/mod_authz_core.so
```

Now our configtest will pass, but when we try to start the server with `apachectl start` (or `apachectl restart`), it will just hang.  What happened?  The trouble, see, is we're using a RedHat system infected with systemd and in yet another example of systemd brazenly trampling over everything it can find, we can't actually start apache on such a system without including a special module to let systemd know how to tie its shoelaces.

```apache
LoadModule systemd_module modules/mod_systemd.so
```

And there we have it.  Apache should have started up and will now be listening on port 80 for http requests.  Below is the complete base minimal svelte apache config for those who like to copy and paste.  Or you can download the file directly from this link:  [svelte-apache-minimal.conf.txt](/pub/svelte-apache-minimal.conf.txt).

```apache
###
### svelte-apache-minimal.conf
### http://czep.net/16/svelte-apache.html
###

###
### httpd.conf for apache 2.4.x (RedHat systems)
###

### Main server configuration
ServerRoot "/etc/httpd"
Listen 80
ServerAdmin webmaster@example.net
ServerName example.net:80

### Base set of modules
LoadModule mime_module modules/mod_mime.so
LoadModule dir_module modules/mod_dir.so
LoadModule log_config_module modules/mod_log_config.so
LoadModule unixd_module modules/mod_unixd.so
LoadModule authz_core_module modules/mod_authz_core.so
LoadModule systemd_module modules/mod_systemd.so

# Pick one MPM module
LoadModule mpm_prefork_module modules/mod_mpm_prefork.so
#LoadModule mpm_worker_module modules/mod_mpm_worker.so
#LoadModule mpm_event_module modules/mod_mpm_event.so

User apache
Group apache
DocumentRoot "/var/www/html"
DirectoryIndex index.html

# Default deny access to root filesystem
<Directory />
    AllowOverride none
    Require all denied
</Directory>

# Configure access to document root
<Directory "/var/www">
    AllowOverride None
    Require all granted
</Directory>

<Directory "/var/www/html">
    Options FollowSymLinks
    AllowOverride None
    Require all granted
</Directory>

# Prevent viewing of .htaccess and .htpasswd files
<Files ".ht*">
    Require all denied
</Files>

# Logging
ErrorLog "logs/error_log"
LogLevel info 
LogFormat "%h %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-Agent}i\"" combined
CustomLog "logs/access_log" combined

# Mime types
TypesConfig /etc/mime.types
AddType application/x-compress .Z
AddType application/x-gzip .gz .tgz

# Misc
AddDefaultCharset UTF-8
EnableSendfile on

```


## Benchmarking (ain't easy)

As noted earlier, running the default apache config incurs a memory footprint of 9.5 MB for each child process.  Using this svelte config, this is reduced to 3.9 MB.  Since request throughput directly depends on the number of child processes running (especially using the prefork MPM), this more than doubles the number of child processes we can have running in the same amount of memory.  We should also not underestimate the importance of eliminating unneeded code on security.  We've loaded just 7 modules (in addition to those built in at compile time) out of the 84 that would have been loaded using the out-of-the-box default config.  Loading unnecessary modules adds bloat and expands the surface area of potential exploits that could be used against your server.  It is highly recommended to only add additional modules when you need them---and then only after reading the documentation on how to best and safely make use of the relevant directives.  This is the best way to ensure your apache remains svelte.

Now, how does our server actually perform?  Apache ships with a handy command line tool called [`ab`](https://httpd.apache.org/docs/2.4/programs/ab.html), the ApacheBench, which will issue a series of requests to a specified url on a web server and then provide a report on the resulting throughput.  First a quick note about artificial benchmarks:  these statistics should only be used for judging the relative impact of different configurations, they should *not* be trusted to provide a realistic forecast of how well your server will handle real-world traffic.  Real users differ from synthetic benchmarks in a variety of important ways.  Real users do odd and unexpected things.  Real users appear from various geographical locations, and hence a diversity of IP addresses.  Real users may request a variety of urls rather than just the one that is hardcoded into the benchmark request.  Real users may reload the page multiple times in quick succession if they are unsatisfied with the load time, impatient, or just bored.  Real users may also be malicious and try various attacks against your server.  The apache benchmark program will, on the other hand, make a set number of requests to a single url from a single ip address.  If you are looking for real world performance, you may need to get creative about how---and from where---you run ab.

Since the intent of using ab here is to compare different configurations, we can use the average number of requests per second across different sets of benchmarking runs as a decent method of comparing the performance impacts of various configuration options.  For consistency in comparing the results, we should run the benchmarks from the same IP address on a server that is receiving no other traffic.  It is also better to stop and start apache before running a new benchmark so that the results will not be biased by an unpredictable state of the server.  The basic way to run ab is to run it with three arguments:  the total number of requests to make (-n), the number of concurrent requests to make (-c), and finally, the actual url to request.  So, to make 100 requests to the index page of our example.net server, with up to 10 requests simultaneously, our command would be:

```bash
ab -n 100 -c 10 http://example.net/
```

The output of ab shows a number of useful diagnostics about the benchmarking run including the min, max, mean, and median connection times of  the requests.  For our purposes, we are mainly interested in one metric---Requests per second.  Using the following commands, we can execute a number of ab runs sequentially and then take the average of the results.

```bash
ITER=30;
N=1000
C=30
URL=http://example.net/
rps=;
for i in `seq 1 $ITER`;
do
    rps+=$(ab -q -n $N -c $C $URL | grep 'Requests per second' | cut -d ' ' -f 7)" "
done 
echo $rps | awk '{s+=$1}END{print s/NR}' RS=" "
```

Apache will start (in the default config) with 5 child processes.  Issuing a benchmark run with multiple concurrent requests will cause the server to spawn multiple new child processes.  If we run another benchmark when apache already has lots of child processes running, those results may not be comparable to those from a freshly restarted server.  So you may want to restart apache before running each benchmark.  You will also get different results depending on where you initiate the benchmark, since network latency will undoubtedly influence the throughput of the test.  Also, feel free to experiment with the above parameters, they were chosen more or less at random.  The main issue to keep in mind is to only compare benchmarks when there is only one variable that differs.  In our case we want to compare the performance using different apache configurations, so all other variables (number of iterations, total requests, concurrent requests, url, and IP address) should remain consistent.  A word of caution before launching an aggressive benchmark:  you may very well DOS your own server, so make sure you don't have real users who may be impacted by this.  Also, if you have any intrusion detection scripts running or IP address request limits (fail2ban, etc.), you may want to relax or disable them while running the benchmark or you may get incomplete results.

There's another variable to consider here too that bears mentioning---if your server is running on a VM in the cloud, that's going to be an extremely poor platform for making performance assessments of your server software.  The reason is that you cannot control for either the load placed on the server by other users or the hypervisor's decision to allocate resources to your VM while the benchmark is running.  In one run, the server might be lightly loaded giving you a lot more resources.  In another, you might get throttled.  I've found that the variance of benchmarking runs on EC2 instances is so large, it's extremely difficult to determine whether your changes are having any effect against the background of other factors contributing to the server's throughput.  Using the short benchmarking script above on a t2.small instance, I might get an average of as few as 40 requests per second or as many as 180.  With such a large variance between runs of the exact same script with no changes on my end, it's clear that factors outside of our control are largely responsible for determining the throughput of a shared, cloud VM.  For that reason, consider benchmarking on a dedicated host---and even then, run the benchmarks from an internal LAN to control for network latency.  

And now finally, with all that out of the way, how does our new svelte config perform?  I created a 4KB index.html file and tested it using the default apache config versus the svelte minimal config above.  I observe a 15% improvement in requests per second using the trimmed down config.  We haven't done a great deal of optimization here---mainly removed a lot of modules whose functionality is not immediately required---but this clearly shows the benefit to cleaning up your apache config:  fewer security concerns, lower memory footprint, and higher request throughput.

## Status and info modules

Next I would like to introduce two helpful modules that can provide a great deal of useful diagnostics about a running apache instance.  These are the [mod_status](https://httpd.apache.org/docs/2.4/mod/mod_status.html) and [mod_info](http://httpd.apache.org/docs/2.4/mod/mod_info.html) modules, and they can be activated with only a few lines of additions to the httpd.conf.  

```apache
# Add to base set of modules
LoadModule authz_host_module modules/mod_authz_host.so

# Monitoring modules
LoadModule status_module modules/mod_status.so
LoadModule info_module modules/mod_info.so

ExtendedStatus On
<Location "/apache-status">
    SetHandler server-status
    Require ip 192.168
</Location>

<Location "/apache-info">
    SetHandler server-info
    Require ip 192.168
</Location>

```

First, there are a few additional modules to load.  The status_module and info_module are the ones that actually do the work.  The [authz_host_module](http://httpd.apache.org/docs/2.4/mod/mod_authz_host.html) is needed to use the `Require ip` directive.  Don't skip this step because status and info will show a lot of detailed information about your server that you will not want to have leaked to the general public.  Include a trusted IP address or range of addresses here so that you can control who has access to these server pages.  You can provide any string that you wish in the 'Location' handler, and this will be the base url of the status or info page.  In the above setting, you will be able to reach your status page at http://example.net/apache-status and your info page will be at http://example.net/apache-info (note, do not include a trailing slash).  Although you could also use hostnames with the 'Require' directive, this will cause a reverse DNS lookup on each request, so it's easier on the server to use IP addresses.

The [`ExtendedStatus On`](https://httpd.apache.org/docs/2.4/mod/core.html#extendedstatus) directive should also be enabled in order to provide more detail in the status output.  The status page will give you a snapshot of the current load on the server, cpu usage, requests per second, bytes transferred per second, and number of requests currently being served.  A detailed "scoreboard" shows the current status of each server (worker thread or process) including statistics on the most recent request it has handled.

The info page shows a great deal of information about the server itself.  The Server Settings section shows similar output as what you would see with the command `httpd -V` so you can see information like the Server Root directory, the current MPM, and the options used to build the server binary.  There is also extensive detail about the current configuration, including the state of all directives that were set in your configuration file.  There is a section for each module currently loaded which shows the available directives corresponding to that module as well as those that are currently set in your config.  This is an excellent way to verify that your config is working the way you expect, and to see what other module directives are available to control different aspects of the server's operation.

You can see our new config including the info and status modules at this link:  [svelte-apache-monitoring.conf.txt](/pub/svelte-apache-monitoring.conf.txt).


## Python and mod_wsgi

When [Graham Dumpleton](http://blog.dscpl.com.au/) first introduced [mod_wsgi](http://modwsgi.readthedocs.org/en/develop/index.html) in 2007, he blazed a trail for python developers to build secure, scalable, and highly performant web applications using python on apache without the limitations of CGI or older frameworks like mod_python.  Today, mod_wsgi remains one of the cornerstones of python web development, used by developers the world over to deploy web apps large and small.  And the mod_wsgi project itself is still maintained solely by Graham himself... we owe him a great deal!  

Mod_wsgi is a very beautiful piece of software and the documentation is also terrifically well written and comprehensive.  It is actually quite easy to get a WSGI app running with only a minimum of necessary configuration.  There are a multitude of configuration options to help control and tune your app to your needs, and the docs do a great job explaining what these options are.  Do take a look and at least read the [Quick Configuration Guide](http://modwsgi.readthedocs.org/en/develop/user-guides/quick-configuration-guide.html).  Additional pointers can be found in that document.  I have also written a bit about setting up mod_wsgi in my post about [Adventures with Flask](http://czep.net/15/adventures-with-flask.html).

In this section, we will setup a WSGI daemon process group on our server so that python web applications can run in daemon mode, rather than the default embedded mode.  For some general advice on why daemon mode is preferred to embedded mode, see [this post from Graham](http://blog.dscpl.com.au/2012/10/why-are-you-using-embedded-mode-of.html).  By moving the python interpreter to a separate process, it can be more easily managed compared to being embedded along with the apache processes handling requests.  Daemon mode also keeps the python code in memory, thus sparing your server from having to reload your app every time a request comes in.

First, install mod_wsgi and some friends using the package manager appropriate for your platform, eg. on Fedora:

```bash
dnf install mod_wsgi python-devel httpd-devel
```

Now, in your httpd.conf, add the following directives to load mod_wsgi and create a daemon process (here called 'dev', though you can name this whatever you like).

    LoadModule wsgi_module modules/mod_wsgi.so
    WSGIDaemonProcess dev processes=2 threads=15 display-name=%{GROUP}
    WSGIProcessGroup dev

The WSGIProcessGroup directive tells apache that all wsgi scripts in the current context (which in our example is the global context since we're not inside a VirtualHost block) will belong to the named daemon process group.  In this code, we've created a process group consisting of 2 processes each having 15 threads which can independently handle application requests.  

## wsgi-info

I wrote a small script called [wsgi-info](https://github.com/czep/wsgi-info) which is loosely modeled on the behavior of the phpinfo() function.  When deployed as a WSGI application, the script will output a lot of variables to give you insight about the environment in which the application is running.  It has no dependencies, apart from a WSGI-compliant server which mod_wsgi has already provided if you installed and configured it as in the above section.  Thus, you can either copy the file directly or clone the project using:

```bash
git clone https://github.com/czep/wsgi-info.git
```

Create a directory `/var/www/wsgi-scripts` and copy the file wsgi-info.wsgi to that directory.  Next, add the following to your httpd.conf:


    WSGIScriptAlias /wsgi-info /var/www/wsgi-scripts/wsgi-info.wsgi

    <Directory /var/www/wsgi-scripts>
        Require all granted
    </Directory>

    <Location "/wsgi-info">
        Require ip 192.168
    </Location>


The [`WSGIScriptAlias`](http://modwsgi.readthedocs.org/en/develop/configuration-directives/WSGIScriptAlias.html) directive maps a url to a wsgi script---this is the entry point for any WSGI-compliant application.  Next, we need to allow apache access to the `/var/www/wsgi-scripts` directory itself.  Finally, since the wsgi-info script may contain potentially sensitive information that we don't necessarily want the whole world to see, we again use a Location directive to restrict access to a known good IP address.  Now, you can see the output of the script by visiting http://example.net/wsgi-info.  If you've worked with phpinfo() then the output will look very familiar.

At the following link, you can find all the configuration we've built up so far, the base minimal config, plus the status and info monitoring, and our new WSGI config:  [svelte-apache-wsgi.conf.txt](/pub/svelte-apache-wsgi.conf.txt).


## SSL/TLS

To setup a webserver in 2016 without considering SSL is borderline irresponsible.  In this section, we will see how easy it is to create a safe, secure, svelte apache SSL server.  While a full background of the rationale and operation of SSL is well beyond our present scope, we will discuss the critical configuration directives required to encrypt traffic to and from our server.

There are three main motivations for why SSL on the web is hugely important:  privacy, authentication, and integrity.  When an SSL session is established between a web server and a client, the traffic between them is encrypted such that only the client and server are capable of decrypting the traffic.  This ensures *privacy*, where the client can be assured that noone else is able to read the contents of what they are sending to or receiving from the server---including the query string itself.  SSL also provides for *authentication*, wherein the client can be assured, by relying on public-key cryptography and a system of trust-based certificate chains, that the server to which they are connecting is in fact authorized to answer requests from the specified domain name.  Finally, due to the carefully constructed mechanisms that establish an SSL connection, the client can be assured of the *integrity* of the message they receive.  There is no way for an attacker to intercept and craft an alternate message in its place; the client would immediately see and reject any such attempt at tampering with the server's message.

As a web server administrator, you should be working with SSL even if you are not dealing with passwords, personally identifying information, or other sensitive topics.  By serving pages unencrypted over port 80, your clients have no way to trust that what they are receiving is authentic.  Any router in between could intercept, redirect, rewrite, or inject ads totally without your consent or knowledge.  There are reports of such nefarious activities happening all the time, for various reasons including profiteering, snooping, censorship, or just general malice.  Imagine your clients connecting to your site using a dodgy free public wifi network that greedily injects ads into unencrypted web pages.  Someone could find an inappropriate image on your site and think it was your doing!  This is not a situation you want to be in.  For your users to trust you, you need to serve your site using https.

So says the guy whose own website that you are now reading is totally unencrypted!  See that's the point---you can't be certain that I've actually written this.  Of course, it's sometimes true that I can't even be certain that I've written this, but that's more a result of [CRAFT syndrome](http://www.urbandictionary.com/define.php?term=Craft+syndrome) than of a failure to use SSL ;)  My excuse, if you would allow me to defend my own hypocrisy, is that my site is currently served by S3, and S3 doesn't currently support a mechanism to serve SSL-encrypted pages.  (Eventually I will need to remedy this, and if S3 doesn't move to SSL on port 443, I will need to move the site to my own server again).  Someday soon we will be able to fully deprecate port 80, just as we have done with port 23, as telnet has been all but superceded by ssh.  Unfortunately, so much web traffic will continue to originate on port 80 so even if we wish to run our site on SSL, we still need to listen on port 80 to forward incoming requests to our secure server.

There is a great deal of literature about SSL (technically, we should be calling it TLS now) but from a web server administrator's perspective we will try to keep it simple.  The easiest place to start is Apache's [SSL/TLS Encryption](https://httpd.apache.org/docs/2.4/ssl/) section of the documentation.  Most of our svelte configuration derives from this section.  In addition, there is some excellent material on [Server Side TLS](https://wiki.mozilla.org/Security/Server_Side_TLS) provided by the Mozilla Project.  Recall the default `conf.d/ssl.conf` file, this is where apache's default SSL configuration is stored which will be enabled if you install mod_ssl along with the openssl package on your server.

```bash
dnf install mod_ssl openssl
```

To activate SSL, we first need to load the [`mod_ssl`](https://httpd.apache.org/docs/2.4/mod/mod_ssl.html) module in our config, as well as the shared object cache provider, [`mod_socache_shmcb`](https://httpd.apache.org/docs/2.4/mod/mod_socache_shmcb.html), which is needed to make use of the `SSLSessionCache` directive, and [`mod_headers`](http://httpd.apache.org/docs/2.4/mod/mod_headers.html) which will be needed to specify the 'Header' directive.

```apache
LoadModule ssl_module modules/mod_ssl.so
LoadModule socache_shmcb_module modules/mod_socache_shmcb.so
LoadModule headers_module modules/mod_headers.so
```

Next, there are several important directives that need to be specified in the global context.  This will pertain to all sites configured later as virtual hosts.

    Listen 443 https
    SSLPassPhraseDialog exec:/usr/libexec/httpd-ssl-pass-dialog
    SSLSessionCache shmcb:/run/httpd/sslcache(512000)
    SSLSessionCacheTimeout 300
    SSLRandomSeed startup file:/dev/urandom  256
    SSLRandomSeed connect builtin
    SSLCryptoDevice builtin
    SSLProtocol -all +TLSv1.2
    SSLCipherSuite ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA256

    SSLHonorCipherOrder on
    SSLCompression off
    SSLSessionTickets off


Since https uses port 443 by default, we will need apache to listen on that port, with the [`Listen`](https://httpd.apache.org/docs/2.4/mod/mpm_common.html#listen) directive, including the port number and the protocol.  According to the documentation, "If not specified, https is the default for port 443 and http the default for all other ports," but it is good form to include the protocol so there is no confusion among perhaps another server administrator.

The [`SSLPassPhraseDialog`](https://httpd.apache.org/docs/2.4/mod/mod_ssl.html#sslpassphrasedialog) directive is necessary if your private key is protected with a passphrase, as it should be.  When apache starts up, it needs to read the private key.  If said key is passphrase protected, it needs some mechanism of obtaining that passphrase.  On RedHat systems, `/usr/libexec/httpd-ssl-pass-dialog` calls `/bin/systemd-ask-password` which will prompt the user for the certificate key file's passphrase if apache is started from within a shell.  If you have a passphrase protected key file and apache is enabled to start at boot time (with `systemctl enable httpd.service`), apache will fail to start until you can get into a terminal and start it manually.

If you find it inconvenient to enter the passphrase on every apache restart, I urge you to think about how inconvenient it would be if your server were compromised and the private key stolen.  If an attacker gains control of a passphrase protected private key file, it will be completely useless to them without the passphrase.  On the other hand, if you decided to save yourself the trouble of dealing with an encrypted private key, leaving the passphrase blank, then a server compromise means that an attacker can impersonate your site, automatically gaining the trust of your customers by serving SSL encrypted pages with your credentials.  Now you will need to revoke and reissue your certificates---but the damage will have been done.  While you're cleaning up that mess, you might as well get a good book on how to sell insurance because that's all that you're going to be doing when this whole episode is cleared up.  And don't try to get clever by replacing the `httpd-ssl-pass-dialog` script with "echo $yourpasswordhere".  You're just handing the passphrase over to the attacker if you do that, so it's no better than not having a passphrase in the first place.  Besides, you shouldn't be doing unattended reboots of critical servers anyway.  

Since SSL sessions are expensive to negotiate, when connection requests are made they can be checked against a cache of recently established sessions.  If such a session exists then the session can be resumed without having to go through the full handshake.  We use the [`SSLSessionCache`](https://httpd.apache.org/docs/2.4/mod/mod_ssl.html#sslsessioncache) directive to setup a shared memory segment in the global server context so that all child processes can have access to the same session cache.  The most efficient cache type is 'shmcb', a shared memory segment enabled by the socache_shmcb_module.  Here we specify a shared memory segment of 512 KB to store our SSL session cache.  We also need to set the [`SSLSessionCacheTimeout`](https://httpd.apache.org/docs/2.4/mod/mod_ssl.html#sslsessioncachetimeout).  300 seconds is the default.

Cryptographic algorithms depend on a good source of randomness which is notoriously difficult for deterministic machines to produce.  The [`SSLRandomSeed`](https://httpd.apache.org/docs/2.4/mod/mod_ssl.html#sslrandomseed) directive will specify one or more sources of randomness for use in these algorithms.  In this configuration we've specified two seeds:  one that is used when the server is started, and another which is used each time an SSL connection request is being established.  At startup, we read 256 bytes from `/dev/urandom`.  For each connection request, we use the 'builtin' seed which provides reasonably good randomness with little performance impact.  If you are responsible for particularly sensitive information, these defaults may not be good enough.  If such is the case, you would do well to consult an expert.

If you have a dedicated cryptographic hardware device in your system, you can specify its use with the [`SSLCryptoDevice`](https://httpd.apache.org/docs/2.4/mod/mod_ssl.html#sslcryptodevice) directive.  Since we have no such device in our system, we use the default 'builtin'.

The next two directives, [`SSLProtocol`](https://httpd.apache.org/docs/2.4/mod/mod_ssl.html#sslprotocol) and [`SSLCipherSuite`](http://httpd.apache.org/docs/2.4/mod/mod_ssl.html#sslciphersuite), are absolutely critical for the secure operation of your server.  This configuration will only allow negotiations to take place using the TLSv1.2 protocol.  This may be too strict for your users, but I cannot in good conscience recommend anything less.  All other protocols involve varying degrees of vulnerabilities, and I will not succumb to the argument that supporting ancient clients is worth sacrificing security.  Honestly, the web *should* be broken for IE6 users on Windows XP.  My site will fail to work for them, as they really *really* need to update to a secure OS and browser.

Next, we specify the cipher suite that should be used to establish the handshake.  This can be a complicated topic, and I regret that I do not really know enough to make my own recommendations which is why I've wholesale copied this from the current version of the [Mozilla SSL Configuration Generator](https://mozilla.github.io/server-side-tls/ssl-config-generator/), using the "Modern" option for Apache 2.4.18.  I trust that they've done a lot more research on this than I have so I don't feel wary by using their list of secure ciphers.

There are a few more directives needed to button-down our security.  By turning on [`SSLHonorCipherOrder`](http://httpd.apache.org/docs/2.4/mod/mod_ssl.html#sslhonorcipherorder), we forbid clients from stating their own preference for a cipher spec, which could lead to degraded security.  Next, we explicitly turn [`SSLCompression`](http://httpd.apache.org/docs/2.4/mod/mod_ssl.html#sslcompression) off because it has been subject to attack:  compressed data can actually be quite predictable and it can be possible to reconstruct sensitive information like the SSL session key if compression is used.  Finally, we also turn off [`SSLSessionTickets`](http://httpd.apache.org/docs/2.4/mod/mod_ssl.html#sslsessiontickets).

With these global configuration directives out of the way, the next step is to configure a [`VirtualHost`](https://httpd.apache.org/docs/2.4/mod/core.html#virtualhost) to encapsulate our secure apache server.

```apache
<VirtualHost _default_:443>
   DocumentRoot "/var/www/html"
   ServerName example.net:443
   ErrorLog logs/ssl_error_log
   TransferLog logs/ssl_access_log
   LogLevel warn
   SSLEngine on

   SSLCertificateFile /etc/pki/tls/certs/example.net.crt
   SSLCertificateKeyFile /etc/pki/tls/private/example.net.key

   CustomLog logs/ssl_request_log \
         "%t %h %{SSL_PROTOCOL}x %{SSL_CIPHER}x \"%r\" %b"

    # HSTS (mod_headers is required) (15768000 seconds = 6 months)
    Header always set Strict-Transport-Security "max-age=15768000"

    # add SSL environment variables to WSGI requests
    <Directory "/var/www/wsgi-scripts">
        SSLOptions +StdEnvVars
    </Directory>

</VirtualHost>  
```

Here, by defining the virtual host as '_default_:443', we specify that the enclosed VirtualHost block will match any ip address on which our server is listening.  We begin by specifying the DocumentRoot and ServerName for our secure server.  If these are omitted, they will be inherited from what was defined earlier in the global context.  You can make these the same or different from the settings for the server on port 80, but the ServerName will need to include '443' as the port number.  In our case, we want the DocumentRoot to be the same.  With the ErrorLog and [`TransferLog`](https://httpd.apache.org/docs/2.4/mod/mod_log_config.html#transferlog) directives, we define new logs for our secure server.  Also note that the [`LogLevel`](https://httpd.apache.org/docs/2.4/mod/core.html#loglevel) directive is not inherited from the global context, so we will need to specify it again here in our VirtualHost context.

Next, we have the configuration directives specific to SSL.  First, we turn on SSL with the [`SSLEngine`](https://httpd.apache.org/docs/2.4/mod/mod_ssl.html#sslengine) directive.   This is followed by the paths to our SSL certificate, in [`SSLCertificateFile`](http://httpd.apache.org/docs/2.4/mod/mod_ssl.html#sslcertificatefile) and also the private key, in [`SSLCertificateKeyFile`](http://httpd.apache.org/docs/2.4/mod/mod_ssl.html#sslcertificatekeyfile).  Read more about these files in the next section.  Although not strictly necessary, we setup a special log that will also include the protocol and cipher suite used, to confirm that SSL sessions are being established as we expect them to be.  Lastly, the [`Header`](http://httpd.apache.org/docs/2.4/mod/mod_headers.html#header) directive here is used to enforce to the client that any further request to our site should be conducted using https.  This is again courtesy of the [Mozilla SSL Configuration Generator](https://mozilla.github.io/server-side-tls/ssl-config-generator/).

The [`SSLOptions`](http://httpd.apache.org/docs/2.4/mod/mod_ssl.html#ssloptions) directive allows us to control a variety of different options that can be enabled or disabled at directory and file level.  One useful option is to make the SSL environment variables available when running WSGI scripts, with '+StdEnvVars'.  We don't enable these globally because they are expensive to generate, but in the context of a dynamically generated python script they will have only a negligible performance impact.  After adding this, be sure to check out the output from the wsgi-info script where you will see a slew of new variables in the WSGI Environment section.

Before we fire up our new SSL server, there is one more addition we're going to make.  As noted earlier, we want the entire site to be running under https.  In the current config, the site is completely available from both port 80 and port 443.  We want to [redirect all http requests to https](https://wiki.apache.org/httpd/RedirectSSL).  To do this, we're going to add a VirtualHost for the insecure server, and put in a [`Redirect`](http://httpd.apache.org/docs/2.4/mod/mod_alias.html#redirect) directive from the [`mod_alias`](http://httpd.apache.org/docs/2.4/mod/mod_alias.html) module.

```apache
LoadModule alias_module modules/mod_alias.so

<VirtualHost *:80>
   ServerName example.net
   Redirect permanent / https://example.net/
</VirtualHost>
```

Our full svelte config with everything discussed above (base minimal + monitoring + WSGI), as well as the SSL config is available here:  [svelte-apache-ssl.conf.txt](/pub/svelte-apache-ssl.conf.txt).

## SSL certificates

If you've just spun up a new server in a RedHat system and are still in the testing phase, you will probably need to be using the auto-generated self-signed certificates with these directives:

```apache
SSLCertificateFile /etc/pki/tls/certs/localhost.crt
SSLCertificateKeyFile /etc/pki/tls/private/localhost.key
```

Using self-signed certificates is perfectly adequate for testing purposes---and in fact, there's nothing technically different about using a self-signed cert vs. one that is signed by a Certificate Authority.  Encryption will still take place between client and server.  The difference, however, is that clients (browsers) have no way of knowing whether a self-signed certificate is legitimate or not.  If clients routinely accepted self-signed certs, then just anyone could generate a cert for example.net and present it to clients who would be none the wiser.  The solution to this problem is that browsers rely on a built-in list of trusted root certificates---certificates that they trust implicitly.  When a server presents a certificate to a client, the certificate usually includes a certificate chain which links the certificate to one of the client's trusted root certificates.  Thus, if a certificate authority signs a given certificate for example.net, and that CA's certificate is among the client's root certificates, then the client will extend its trust to the server's certificate and allow the connection to take place.  With self-signed certificates, modern browsers will present a very prominent warning message to the user urging them that the credentials in the certificate could not be verified.  If you want your SSL server to be accepted by web browsers, you will need to obtain a certificate that is signed by---or can be linked via a chain to---one of the trusted root certificates by known CAs.

Until very recently, obtaining signed SSL certificates has been an expensive task---both in terms of manual processes and actual cost.  Thankfully, the [Let's Encrypt](https://letsencrypt.org/) project has disrupted the decades-long lack of innovation in this area by offering free, automated, trusted SSL certificates to all.  I, for one, am highly impressed by how easy the process is, and if you don't already use a CA (and even if you do), I urge you to try it out.

The Let's Encrypt website includes a client and very good instructions for [getting started](https://letsencrypt.org/getting-started/).  A good Let's Encrypt tutorial specific to Fedora folks can be found in this [Fedora Magazine article](https://fedoramagazine.org/letsencrypt-now-available-fedora/).  As with all things security-related, our good friends at [Calomel](https://calomel.org/) have created an [excellent guide](https://calomel.org/lets_encrypt_client.html) to Let's Encrypt with an easy to use bash script.  You'll find everything you need to generate your new certificate in the instructions.  Follow the text carefully, move your new certificate and private key to their proper locations (being careful not to break SELinux contexts!), restart apache, and away you go!















