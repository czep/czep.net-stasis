---
layout: post
title: Building a Home PC - Part 4  Linux Installation
date: 2011-08-16
topics: linux
---
Fun with the favorite OS.

<!--excerpt-->

As chronicled in the [first](/11/building-a-home-pc-part-1-motivation.html)
[three](/11/building-a-home-pc-part-2-hardware.html)
[parts](/11/building-a-home-pc-part-3-build-day.html)
 of this series, I have just finished building a new computer and now I am going to install linux and get down to work.






I wrote <a href="https://czep.net/weblog/linux.html">this essay about linux</a> a long time ago and my feelings haven't changed much over the years.  Linux remains one of the most disruptive technologies of our time and it is unfathomable to think of any facet of today's internet, the state of software development, or scientific computing if we didn't have the linux operating system and the GNU toolset that form the bedrock of the open source software stack.  Linux recently turned 20 years old.  It's unix roots date back more than 40 years.  Yet, far from being out of date, linux is everywhere today, from mobile phones to data centers, investment banks to web startups.  Linus's mission of world domination has in fact already come true.







When it comes to choice of linux distribution, there can be a lot of unnecessary zealotry that gets in the way of what is otherwise a common set of shared goals in the same community.  The truth is, they're all good!  I've used all the majors and have had favorites from time to time, and from each distribution I try to learn what makes it unique, the philosophy of the design decisions, and why the developers have chosen to do things that way.







I've chosen <a href="http://www.centos.org/">CentOS 6</a> as the distribution for my new computer for mostly personal reasons rather than an insistence that it is the best distro for everyone at all times.  For one, I've been using RHEL for the past 5 years at work so I'm familiar with the environment.  CentOS has also been gaining a lot of momentum lately and I have found the community around it to be very supportive and proactive.  Last but not least, as a stable enterprise-grade distribution, CentOS is an excellent platform for development that targets deployment to the widest audience, from large-scale corporate customers to pre-packaged web appliances or VMs.







Those who have followed my hardware build will have realized that I am building this as a headless workstation, or a home server that I will stick in the corner and connect to via ssh.  After I get the wireless configuration working, I'll disconnect the monitor and put it back in storage.  This makes installation easier, since I don't need to install multiple geebies of GUI frameworks.  Usability is improved too.  I love linux but I have to admit that my favorite "linux desktop" is a Mac Book.  Yeah, flame on.







I also don't have an optical drive (seriously, why bother?) so I'll need to install the OS from a USB flash drive.  CentOS fully supports this, as long as your BIOS does which it should if your computer is anything less than 10 years old.  However, there is one tiny quirk:  you need to copy the ISO file itself onto the flash drive *after* burning the ISO image to it.  Why?  When the installer is running from the USB flash drive, it thinks it is running from a hard drive and it needs to be pointed to the ISO file, it can't reflect back out of itself and point to the image it's running from.  Yeah that makes sense, right?  Here is a <a href="http://richmegginson.livejournal.com/19848.html">helpful step by step explanation</a>.







There are really only two things that happen during installation that you need to think about:  disk partitions and package selection.  The <a href="http://docs.redhat.com/docs/en-US/Red_Hat_Enterprise_Linux/6/index.html">official RHEL documentation</a>, which you should of course read from beginning to end before getting yourself into trouble, has some standard <a href="http://docs.redhat.com/docs/en-US/Red_Hat_Enterprise_Linux/6/html/Installation_Guide/s2-diskpartrecommend-x86.html">recommendations for partitioning</a> and how much swap space you should use.







I chose a "Minimal Installation" and a small number of other useful packages to keep the box free from lots of unnecessary clutter, and to have more fine-grained control on what gets installed later.  After the base install, df reported just under 1GB of space used.







Installing the base OS is only the first step.  Now the real fun begins as you get to customize your new linux box to look and feel exactly the way you like.  In the next post I will provide an outline for some common post-installation tasks that will help make the computer more secure and more usable.
