---
layout: post
title: Recommendation for Linode VPS
date: 2012-05-18
topics: web
---
Last month I began hosting this website on a VPS provided by [Linode.com][linode] and am happy to report being yet another happy customer of their excellent service.  The entry level Linode 512 plan provides more than enough resources for a small to medium sized hobby or personal site.  They have an excellent administrative system which makes provisioning a new VPS a simple painless operation.  There is also an extensive collection of documentation at the [Linode Library][linodelib] which includes guides for many of the common tasks you will encounter when setting up a new site.  Their support is also outstanding.  It is difficult to consider alternatives when Linode has already done everything right.



[linode]: http://www.linode.com/

[linodelib]: http://library.linode.com/

<!--excerpt-->

Last month I began hosting this website on a VPS provided by [Linode.com][linode] and am happy to report being yet another happy customer of their excellent service.  The entry level Linode 512 plan provides more than enough resources for a small to medium sized hobby or personal site.  They have an excellent administrative system which makes provisioning a new VPS a simple painless operation.  There is also an extensive collection of documentation at the [Linode Library][linodelib] which includes guides for many of the common tasks you will encounter when setting up a new site.  Their support is also outstanding.  It is difficult to consider alternatives when Linode has already done everything right.



Shared hosting can be a convenient, low-cost, trouble-free way to run a basic website, but for the perfectionist sysadmin it can also be a frustrating experience.  First and foremost, you do not have root access.  If you are used to managing your own boxes, not having root access is like having a cool lego set whose bricks are glued together.  Secondly, you're subject to the software choices of the host provider.  This usually means PHP and MySQL, two of the most boring technologies in the universe.  A shared host will limit your ability to run cron jobs and custom scripts.  Forget about making any changes to the web server configuration.  Thirdly, you will share this environment with a steaming mass of poorly optimized sites replete with redundant javascript libraries, uselessly large  bandwidth-consuming images, and third party ad calls designed solely to eat up the CPU time and flood the network interface with annoying ads on which nobody wants to click.  It's like riding on a bus crowded with fat tourists laden with backpacks and suitcases during your morning commute.



Sadly, despite these pains we put up with shared hosting because it's far cheaper than colocation and with the added bonus that you do not have to deal with hardware failures or upgrades.  Fortunately there is another way:  the [Virtual Private Server][vps].  With a VPS, you get root access to your own virtualized slice of a server, within which you are free to install the OS and supporting applications of your choice.  While there are other users on the server, in the form of other VMs running on the same hardware, you do not share the environment with anyone and have complete freedom to customize it to your liking.  Finally, a dream come true for the perfectionist sysadmin (on a budget).



The $20 price point is a hard bargain to find if you want a robust and reliable infrastructure, enough resources to handle a medium-sized site, a friendly and capable UI, and responsive customer support.  If you're like me and you've already exhausted your free one-year micro tier at AWS, you'll be facing a monthly bill around $100 per month to power your website with an always-on EC2 instance.  This is a bit steep for a personal site.



Virtualization is now a mature technology and there are plenty of bargain solutions available out there.  [Lowendbox][lowendbox] provides a great resource for listings and reviews of very inexpensive VPS and dedicated server offerings.  I've tried out several of the very frugal services and have been generally surprised at what you can get with just a few dollars per month.  I've also tried some of the more popular names in the business and have had mixed results.



For my personal site, I do not need a great deal of computing horsepower, but I also do not want to worry about data loss, excessive downtime from problems not caused by me, security, maintenance and monitoring or sudden a bankruptcy of the server provider.  After seeing so many positive reviews for [Linode][linode], I tried them out for a few months on some side projects and was thoroughly impressed.  My experience working with them led me to decide it was finally time to move [czep.net][czep] off of shared hosting and onto my own private server.



[lowendbox]: http://www.lowendbox.com/

[linode]: http://www.linode.com/

[linodelib]: http://library.linode.com/

[vps]: http://en.wikipedia.org/wiki/Virtual_private_server

[czep]: http://czep.net/

