---
layout: post
title: Building a Home PC - Part 5  Post-install Configuration
date: 2011-08-21
topics: linux
---
After installing linux and logging in for the first time, run at least these basic commands to ensure that everything looks the way you expect:  ps aux, top, free, df, du.  Also look at anaconda-ks.cfg and install.log in root's home directory for a complete log of the installation process to make sure there weren't any errors or that you find something unexpected.

<!--excerpt-->

After installing linux and logging in for the first time, run at least these basic commands to ensure that everything looks the way you expect:  ps aux, top, free, df, du.  Also look at anaconda-ks.cfg and install.log in root's home directory for a complete log of the installation process to make sure there weren't any errors or that you find something unexpected.







For CentOS users, the <a href="http://docs.redhat.com/docs/en-US/Red_Hat_Enterprise_Linux/6/index.html">official RHEL documentation</a> is all applicable which is great because it's also very good documentation.  Read at least the <a href="http://docs.redhat.com/docs/en-US/Red_Hat_Enterprise_Linux/6/html/Installation_Guide/index.html">Installation Guide</a>, <a href="http://docs.redhat.com/docs/en-US/Red_Hat_Enterprise_Linux/6/html/Deployment_Guide/index.html">Deployment Guide</a>, <a href="http://docs.redhat.com/docs/en-US/Red_Hat_Enterprise_Linux/6/html/Developer_Guide/index.html">Developmer Guide</a>, and <a href="http://docs.redhat.com/docs/en-US/Red_Hat_Enterprise_Linux/6/html/6.0_Release_Notes/index.html">Release Notes</a> so you're fully up to speed on the fundamentals of your new linux box.







What follows is my own post-install checklist which you should certainly supplement with other sources.  For one thing, I am installing this within my home network, so security settings do not have to be as tight as if this were directly internet-facing.



* **wifi**.  Since I'm not using a LAN cable, I need to configure a wireless interface to work at startup.  In another post I talk about [configuring wpa_supplicant](/11/wireless-linux-at-boot-without-x.html) for this purpose.



* **yum**.  Learn the basics for updating packages to keep the software on your system current and minimize potential exploits.



* **sshd**.  The ssh server is enabled by default, but you should make a few configuration changes to shore up security.  At the very least, disable root logins with the directive "PermitRootLogin no" in /etc/ssh/sshd_config.  Also consider using keys instead of password authentication.



* **lm-sensors**.  This library and associated client software allows you to read useful data from your motherboard including temperatures, fan speeds, and voltages, that you can monitor to ensure your computer stays in good health.  I almost never get this working out of the box, and in another post I describe the steps on the road to [getting lm_sensors to work](/11/getting-lm_sensors-to-work.html) with my chips.



* **adduser**.  Don't run around as root for too long, you need to create an everyday account with standard privileges to protect you from yourself.  I've learned to never underestimate my own stupidity.



* **ntpd**.  Keep time sensibly.



* **chkconfig**.  Give this a glance to make sure you don't have any unnecessary services running, and research anything you find unfamiliar here.



* **iptables**.  Even behind a firewall, it's good practice and not very time-consuming to setup packet filtering.



* **logrotate**.  Logs grow like weeds and periodically need to be trimmed back.  Configure this to keep log files in check.




There are a great many other tweaks you may want to do after installing linux.  There are also tons of guides available on the topic that a few choice Google searches will readily uncover.  Apart from the official RedHat documentation mentioned above, another nice repository of information is the <a href="http://library.linode.com/">Linode Library</a> offered by linux VPS vendor <a href="http://www.linode.com/">Linode.com</a>.  There's also <a href="http://content.hccfl.edu/pollock/AUnix1/PostInstall.htm">this great resource</a> which provides a very thorough list of post-installation tasks and describes a number of the different files that you may want to customize on your system.







I find it's best to start small, lock everything down, and then gradually add additional software you need as you need it.  Using yum is the easiest way to install because dependencies are automagically checked and you can upgrade with a single command.  Still, you can always drop into /usr/local/src and compile your own tarballs, just like the good old days.  Just remember, however, that any customization you do may introduce idiosyncracies that make developing software difficult.  You want your environment to be tailored to your needs, but not so customized that the software you develop there can't be easily ported to other systems.







Working on your own linux system is wonderful learning exercise.  If you run into something unfamiliar, do a little research and you'll be all the wiser for it.  Soon you'll have your system all ready for work and/or play.  Most importantly, don't forget:  have some fun!
