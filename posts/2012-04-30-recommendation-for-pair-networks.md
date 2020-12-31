---
layout: post
title: Recommendation for Pair Networks Web Hosting
date: 2012-04-30
topics: web
---
After 7 years as a customer of [Pair Networks](http://www.pair.com), I am leaving the safe comfortable confines of shared hosting for the wild jungle world of VPS.  It was a difficult decision because Pair.com has an excellent setup and provides the best customer service and support in an industry where such features are hard to find.

<!--excerpt-->

## The End of an Era



For more than 7 years, [czep.net][] was hosted at [Pair Networks][pair].  In the early afternoon of 01 April 2012, with little fanfare, I disabled the DNS configuration for this website at Pair.com and pointed the official nameservers to their new home.  After cleaning up all the DNS entries and migrating all my old files and databases, I finally cancelled my account at Pair.com this morning.  I leave as a very satisfied customer, and would extend them my highest recommendation to anyone in consideration of a shared web hosting service.



The web hosting industry changes fast and has always been tumultuous throughout its relatively short history.  I did an insanely extensive amount of due diligence when I initially decided on Pair.com, and repeated the exercise every year to verify whether they were still on top of the heap.  And every year, I came to the same conclusion:  there simply is no better shared hosting service.



In 2004, as today, the market was flooded with cheap hosting services promising unlimited data transfer, five-nines uptime, millions of free email aliases, unlimited reseller accounts, control panels, and various other gimmicky selling points.  Yet, as Chuck and Flav admonished many years ago, "don't believe the hype."  Servers are fickle and networks more so.  Maintenance of a NOC is not easy and Pair gets it right.



[Pair Networks][pair] stands above the crowd by providing a competitive feature set on a robust server and network infrastructure backed by stellar customer service.  You can find a cheaper service but you will pay for it in other ways.  You'll pay for it when you share an oversold server that grinds to a halt from an onslaught of traffic.  You'll pay for it when a disk fails and your site is down for two weeks while a backup is located---if a backup is located.  You'll pay for it when you receive a reply from customer support saying that they can't help you and why don't you read the forums---if you receive a reply.  You'll pay for it when someone else's poorly written cgi script compromises the server and your entire customer database winds up in a pastebin.  There are so many things that could go wrong, why would you even risk them for the sake of saving a few dollars per month?



## So if I love Pair so much, why did I leave?



Before Pair, I hosted the domain myself, out of a lovely little old beige box running [Slackware Linux][].  When I was a grad student, all the ports in our building had statically allocated IP addresses, and being friends with the datalab administrator I was able to get the proper DNS entries in place.  Later, I was leasing office space from a local ISP whose owners were kind enough to do the same, after I promised not to be a spam king of course.  When I lost my static IP connection to the internet and friendly DNS server admins, I was not thrilled by the prospect of handing over the keys to the kingdom to a typical oversold server mill.  However, the cost of colocation was then, and still is today, too steep for a personal web site.  Shared hosting was my only cost-effective option.



The market changed when Virtual Private Server offerings became competitive with entry level shared hosting platforms.  A shared host must split its resources across many customer sites.  If those other sites are idle, a very powerful server is almost entirely at your disposal.  Unfortunately, this is a rare occurrence, and you will usually be in contention with many other sites for those resources.  On the other hand, a VPS can guarantee that your site will have a consistent and dedicated level of CPU, RAM, storage, and bandwidth.



Another key distinction is that while a shared host will provide you with a user account on a managed server, a VPS provides you with a root account to an isolated, unmanaged virtual machine.  All the software installation and configuration, including the operating system, is up to you.  This level of flexibility and control is not for everyone, which is why shared hosting will remain a viable service offering for a long time.  But for those of us who want the freedom, power, and responsibility of root access on the internet, a VPS is the next best thing to running a DS3 into your home.



Pair does have an excellent VPS solution, [pairVPS][], but it is pricier than their web hosting solutions because they also include server management and support.  This would be the perfect solution for someone who needs more computing power than what a shared host can supply, but is not fully ready (or willing) to take full responsibility for the arduous tasks of setup and configuration of the OS and supporting application stacks to run the site.  If I were in this position I would not hesitate to try out pairVPS given my excellent experience with their shared hosting.



An era has come to an end.  I can't recall ever leaving a vendor about which I felt so highly.  I'm reminded of the old break-up cliche, "it's not me, it's you."  Pair has been an excellent host, but I've changed and grown out of the need for a managed service, having decided---perhaps foolishly---that I once again want to hold the reins and build my site to my own spec, with nobody but myself to blame when things go wrong.



[czep.net]: http://czep.net

[pair]: http://www.pair.com

[Slackware linux]: http://www.slackware.com/

[pairVPS]: http://www.pair.com/services/vps/

