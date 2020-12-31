---
layout: post
title: Building a Home PC - Part 3  Build Day
date: 2011-08-14
topics: linux
---
The fun of build day.

<!--excerpt-->

The day all your components arrive, you will probably be tempted to rip open the packaging and start throwing things together immediately.  Try to keep your composure and do a little bit of planning first.  Make sure you really do have all the components you need before getting started.  This includes all the little extras like case fans, cables, case screws, a screwdriver set, and zip ties for cable routing.  Read the documentation and installation instructions that come with your components, or visit the manufacturer's website and forums for helpful advice and information that will make your build go more smoothly.







Make a plan, write down the steps.  Think about the order of operations:  install the processor, memory, and any peripheral cards on the motherboard first, then install the motherboard in the case.  Should the power supply go in first or last?  Make sure you can answer that question or you may find yourself taking things out and starting over again!  When you've got a good plan and are finally ready to build, try to follow these three general points of advice:



* Try to do it all in one sitting.  Start early so you're not tired and won't have to leave an open chassis with parts hanging out of it overnight.



* Use an anti-static wrist strap.  You may feel like a total dork wearing it, but the truth is that voltages much smaller than you can detect are more than enough to fry the sensitive components for which you have just paid a lot of money.



* When you turn it on the first time, expect it not to work.  That way, when it does work you'll be pleasantly surprised!




The build of my <a href="http://www.lian-li.com/v2/en/product/product06.php?pr_index=545&amp;cl_index=1&amp;sc_index=25&amp;ss_index=64">Lian-Li PC-Q11</a> was a lot easier than I had expected.  Despite its small size, the case is well engineered such that all the parts have just enough space to fit where they need to be.  I have only two very minor pain points, which are more an issue with the motherboard I selected, the <a href="http://www.asus.com/Motherboards/Intel_Socket_1155/P8H67I_DELUXE/">Asus P8H67-I Deluxe</a>, rather than the case.  First, the front panel of the case offers two USB 3.0 connectors, but the Asus board has no internal USB 3 ports so I would have to route the cable through the case and out the back to plug into the rear USB 3 ports.  However, according to the manual, the USB 3 controller will currently only work with Windows.  I don't really have a burning need for USB 3 on the front panel, so instead I'm routing the front panel USB 3 cable through the optical drive bay, using the supplied USB3 to USB 2 connector.  That connector is a bit of a beast, but since I don't have an optical drive, I can easily tuck it away for now.







The second issue is my drive configuration.  I have a SATA 3 SSD and a SATA 6 HDD, but the SATA 6 cable supplied by Asus is angled at one end so that it stupidly blocks both SATA 6 ports on the motherboard.  If I get a new SATA 6 device, I will need to replace that cable with one that has straight, not angled, connectors on both ends.







Choice of power supply is very important for this case.  I was not impressed by the quality of the current generation of compact SFF power supplies, but fortunately Lian-Li has designed the Q11 to support standard ATX-sized power supplies.  My choice was the <a href="http://www.seasonicusa.com/S12II-Bronze.htm">SeaSonic S12II 520W</a> model.  Not only does this afford a stable efficient source of power, it also plays a key role in airflow management.  The Q11 has a 140mm fan in the front of the case for air intake, but there is no fan in the rear.  The power supply has a 120mm fan that pulls air from over the motherboard and exhausts it out the back.  Note that this setup means that the power supply fan contends with the processor cooling fan which typically pulls air down onto the heatsink.  In the Q11, the two fans are not far apart, and some have recommended reversing the direction of the processor fan.  So far I am using the stock Intel heatsink and fan that came with the i3-2100, and I haven't had any troubles yet with temperatures or the fan speeds.







Here is a view of the first successful power on test, before fully seating the power supply and taking care of those pesky cables.



<p style="text-align:left;"><img title="FrankenKomputer" src="/img/blog/2011-09-building-a-home-pc-part-3-build-day-1.jpg" alt="" width="40" height="40" />A bit more close-up you can see there won't be much room between the front fan and the end of the power supply once it's in place.<img title="The cables *will* bite" src="/img/blog/2011-09-building-a-home-pc-part-3-build-day-2.jpg" alt="" width="40" height="40" /></p>



<p style="text-align:left;">One key feature of SeaSonic's S12II power supply is that it is only 140mm in length, whereas many ATX PSUs are 160mm.  As you can see, in this case a couple of centimeters is a big deal.  There is also some debate as to whether having a PSU with modular cables is better.  I decided against it for two reasons.  The main reason is that modular cables require extra clearance at the back to plug them in.  In this case, they may get jammed up against the case fan.  Secondly, with most modular power supplies, there are still many required cables that you can't remove, so it doesn't save all that much.</p>



<p style="text-align:left;">In the next post, I'll get down to some real work, and install linux on this new computer.</p>
