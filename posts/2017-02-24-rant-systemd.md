---
layout: post
title: My little rant about systemd
date: 2017-02-24
topics: linux
---

The real issue with systemd isn't technical, it's sociological.  How did this system achieve widespread adoption despite widespread opposition and admission even among its proponents that it wasn't nearly stable?  Understanding the social organization of open source development should be the primary goal of the community if we hope to learn from and prevent such mistakes in the future.

<!--excerpt-->

The real issue with systemd isn't technical, it's sociological.  How did this system achieve widespread adoption despite widespread opposition and admission even among its proponents that it wasn't nearly stable?  Understanding the social organization of open source development should be the primary goal of the community if we hope to learn from and prevent such mistakes in the future.

[A lot](http://ewontfix.com/14/)
[has](https://bsdmag.org/randy_w_3/)
[already been](http://www.zdnet.com/article/linus-torvalds-and-others-on-linuxs-systemd/)
[written](https://www.infoworld.com/article/3159124/linux/linux-why-do-people-hate-systemd.html)
[about](https://chiefio.wordpress.com/2016/05/18/systemd-it-keeps-getting-worse/)
[why](http://blog.darknedgy.net/technology/2015/10/11/0/)
[systemd](http://judecnelson.blogspot.com/2014/09/systemd-biggest-fallacies.html)
[sucks](https://suckless.org/sucks/systemd).

From a system design perspective, there are multiple criticisms of systemd that I continue to find disturbing:
* the use of binary journal files for logging
* tight coupling of modules
* a monolithic architecture that is counter to the essential UNIX philosophy
* the opacity of configuration
* overloading of PID 1
* dependency bloat
* required reboots

...to name a few. Apart from the technical arguments, what I actually find most interesting about the systemd story is the sociological aspect: how did such a system achieve rapid adoption without appropriate consideration from the broader community?  Distributions known for being highly conservative made very fast decisions about the basic architecture of their systems.  Scripts that had been stable for 25 years were supplanted by a fundamentally different approach which was still plagued by bugs and suffering stability issues.  The very fact that the technical arguments against systemd were brushed aside in the rush to adopt is a cautionary case study in how open source systems evolve.  Today, understanding *how this happened* is, in my opinion, much more important for the community than continuing to debate the technical merits and demerits of systemd.

From a linux user's perspective, my disdain for systemd is motivated by what I perceive to be very annoying usability issues.  Consider: in RHEL6 we had this:

    service httpd start

Then we woke up to RHEL7 to find this:

    systemctl start httpd.service

Three things annoy me about this.  First, why 'systemctl'?  This is ugly AF and makes me cringe every time I have to type it.  You really couldn't come up with a better command name?  I suppose they first thought 'systemcontrol' was just too long, so let's shorten it.  But 'sysctl' was already taken, so they had to decide between 'syscontrol' and 'systemctl'.  But why not 'sctl'?  Or why not just call it 'system' and follow the legacy API?  This brings me to the second point:  they reversed the order of the arguments to the command!  WHY WOULD YOU DO THIS?  This is basic UX 101:  don't make the user think.  To switch up the order of the command verb and the target is a small but very telling annoyance demonstrating how little regard the systemd designers had for their users.  Finally, what's this '.service' cruft all about?  Sometimes you need it and sometimes you don't, either way it's exceptionally annoying and adds nothing but hassle for the user.  

And another thing...  Configuration of systemd units is a maddening exercise that you can't possibly convince me is more convenient than an init script.  Take a look at the [introductory docs](https://access.redhat.com/documentation/en-US/Red_Hat_Enterprise_Linux/7/html/System_Administrators_Guide/sect-Managing_Services_with_systemd-Unit_Files.html) about how this works---it's like reading a Visual Basic .ini file with magic words everywhere making it impossible to follow the logic.

I get that SysVinit has flaws.  But gutting a stable system to fix a problem may simply result in introducing a new one.  For instance, people complain that the serial nature of SysVinit is bad because it increases boot times.  Never mind that the real culprit behind longer boot times is UEFI nonsense.  So now we've replaced serial init with a parallel system in which critical system daemons are brought up in a non-deterministic sequence.  So good job, you've brought down boot times but introduced all kinds of subtle breakage that can be very difficult to track down because the initialization process is not consistently reproducible.

How did systemd get adopted so quickly?  No other issue has provoked more division in the linux community.  A change of this magnitude is nowhere in the same category as upversioning glibc or gcc or the kernel, and yet distributions go through lengthy test processes when rolling out new major versions of the toolchain.  How could an immature and completely fundamentally different system like this get pushed into so many distributions without these checks in place?  This is the real lesson we all need to consider about systemd.  This is a sociological problem, not a technical one.  

