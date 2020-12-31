---
layout: post
title: Getting lm_sensors to work
date: 2011-09-17
topics: linux
---
<a href="http://www.lm-sensors.org/">lm_sensors</a> is a wonderful little library that provides access to hardware monitoring data provided directly by motherboard chips and processors.&nbsp; This includes voltages, fan speeds, and temperatures, all very important for monitoring the health of your system.&nbsp; Motherboard manufacturers usually supply their own monitoring applications included on CD, but these are almost always Windows only.&nbsp; For linux users, the lm_sensors library is usually the only way to access this data.

<!--excerpt-->

<a href="http://www.lm-sensors.org/">lm_sensors</a> is a wonderful little library that provides access to hardware monitoring data provided directly by motherboard chips and processors.  This includes voltages, fan speeds, and temperatures, all very important for monitoring the health of your system.  Motherboard manufacturers usually supply their own monitoring applications included on CD, but these are almost always Windows only.  For linux users, the lm_sensors library is usually the only way to access this data.







Unfortunately, for some silly reason, most motherboard manufacturers seem incredibly reluctant to release the details of the chips they use.  (It's silly because there is no market for competing on hardware monitoring applications).  Anyway, since lm_sensors is a volunteer effort within the open source community, it can take awhile for new motherboards to be supported, especially if the monitoring chips are new.







Intel's Sandy Bridge processors and accompanying LGA 1155 motherboards became available in early January.  Apart from a SATA glitch that necessitated a recall, most of the boards have been in the market since early April.  I am usually not an aggressive early adopter because I want my systems to be stable, but with new chipsets, processors, and sockets being refreshed about every 6 months, it's difficult to anticipate what is or will qualify as stable these days.  In any case, price for performance is a much more important factor on which to base your purchasing decisions than hardware sensor support.







So this means that whenever I build a new computer the chances that lm_sensors will work out of the box is small.  Sometimes you will get lucky, other times a few judicious tweaks will solve the problem, but unfortunately sometimes nothing will work and all you can do is write a strongly worded letter to your motherboard manufacturer.







I had good luck this time, but only after some much needed help from my friends on the internet.  Here is an account of how I got lm_sensors working with my Intel Core i3-2100 and Asus P8H67-I Deluxe motherboard.







First, [my motivation](/11/building-a-home-pc-part-1-motivation.html).  Since I built this computer to sit in a corner and periodically handle quite a bit of computation, I want to be able to monitor the temperatures to make sure it can stay cool under heavy load.  lm_sensors is one of the first packages I try to configure before getting into serious work.







After installing CentOS 6 and running sensors_detect, I was greeted with the oh so depressing missive:  "No sensors found."  My first attempt at solving the problem was to upgrade to the latest version, in this case 3.3.1, since the version supplied with the OS is a few revisions old.  With the new version, sensors_detect was able to identify the available monitoring chips and the drivers that should be loaded to read them:




    Driver `w83627ehf':
    * ISA bus, address 0x290
    Chip `Nuvoton NCT6776F Super IO Sensors' (confidence: 9)

    Driver `coretemp':
    * Chip `Intel digital thermal sensor' (confidence: 9)






Unfortunately, sensors continued to report "No sensors found."  When I tried to load the drivers manually I got some helpful diagnostics that provided some clues.





    # modprobe coretemp
    FATAL: Error inserting coretemp (/lib/modules/2.6.32-71.29.1.el6.x86_64/kernel/drivers/hwmon/coretemp.ko): No such device

    # tail /var/log/messages
    kernel: coretemp: Unknown CPU model 0x2a

    # modprobe w83627ehf
    FATAL: Error inserting w83627ehf (/lib/modules/2.6.32-71.29.1.el6.x86_64/weak-updates/w83627ehf/w83627ehf.ko): Device or resource busy

    # tail /var/log/messages
    kernel: w83627ehf: Found NCT6776F chip at 0x290
    kernel: ACPI: I/O resource w83627ehf [0x295-0x296] conflicts with ACPI region HWRE [0x290-0x299]
    kernel: ACPI: If an ACPI driver is available for this device, you should use it instead of the native driver






The adventure began.  I came up with the following strategy:  install the full kernel source, inspect coretemp.c, compare it with a recent vanilla kernel from kernel.org, and recompile the newest version of the driver in my local source tree.  I hacked away for a few hours but it very quickly became readily apparant that my knowledge of device drivers was woefully inadequate to make this work.







My next strategy was to reach out to the experts, and I posted <a href="http://lists.lm-sensors.org/pipermail/lm-sensors/2011-August/033503.html">an inquiry</a> to the <a href="http://www.lm-sensors.org/wiki/FeedbackAndSupport">lm_sensors mailing list</a>.  I am well aware that the lm_sensors maintainers are not responsible for supporting every possible motherboard chipset out in the wild, especially new ones that haven't been reverse engineered yet and for which the manufacturers have inconveniently failed to provide the proper documentation for their hardware.  I was hoping I wasn't the only user with this board out there and that someone would have an idea how to get sensors to work.







After waiting for some time for a reply (they are busy folks), I next tried the CentOS support forum and was met with <a href="https://www.centos.org/modules/newbb/viewtopic.php?topic_id=33061&amp;forum=55&amp;post_id=141732#forumpost141732">some very helpful advice</a> as well as an offer by the <a href="http://elrepo.org/tiki/">ElRepo</a> team to backport the newest coretemp for use with my kernel.  I filed a <a href="http://elrepo.org/bugs/view.php?id=181">Request for Enhancement</a> and they succeeded where I had failed.  They released a new <a href="http://elrepo.org/tiki/Packages">kmod-coretemp</a> package for CentOS 6 which worked flawlessly.







I also installed the w83627ehf package from ElRepo and based on advice I received on the forum, was able to get that working by adding "acpi_enforce_resources=lax" to the kernel boot directive in /etc/grub.conf.







To setup ElRepo as a repository on your system, follow <a href="http://elrepo.org/tiki/tiki-index.php">these instructions</a>.







Then:


    yum install kmod-w83627ehf
    yum install kmod-coretemp




At last, I have output from sensors:


    coretemp-isa-0000
    Adapter: ISA adapter
    Core 0:       +39.0°C  (high = +82.0°C, crit = +102.0°C)
    coretemp-isa-0001

    Adapter: ISA adapter
    Core 1:       +33.0°C  (high = +82.0°C, crit = +102.0°C)
    nct6776-isa-0290

    Adapter: ISA adapter
    in0:           +0.89 V  (min =  +0.00 V, max =  +1.74 V)
    in1:           +1.05 V  (min =  +0.00 V, max =  +0.00 V)  ALARM
    in2:           +3.38 V  (min =  +0.00 V, max =  +0.00 V)  ALARM
    in3:           +3.38 V  (min =  +0.00 V, max =  +0.00 V)  ALARM
    in4:           +1.00 V  (min =  +0.00 V, max =  +0.00 V)  ALARM
    in5:           +2.04 V  (min =  +0.00 V, max =  +0.00 V)  ALARM
    in7:           +3.41 V  (min =  +0.00 V, max =  +0.00 V)  ALARM
    in8:           +3.36 V  (min =  +0.00 V, max =  +0.00 V)  ALARM
    fan1:         1002 RPM  (min =    0 RPM)  ALARM
    fan2:         1140 RPM  (min =    0 RPM)  ALARM
    fan3:            0 RPM  (min =    0 RPM)  ALARM
    fan4:            0 RPM  (min =    0 RPM)  ALARM
    fan5:            0 RPM  (min =    0 RPM)  ALARM
    SYSTIN:        +32.0°C  (high =  +0.0°C, hyst =  +0.0°C)  ALARM  sensor = thermistor
    CPUTIN:        +92.5°C  (high = +81.0°C, hyst = +76.0°C)  ALARM  sensor = thermistor
    AUXTIN:        +92.5°C  (high = +80.0°C, hyst = +75.0°C)  ALARM  sensor = thermistor
    PECI Agent 0:  +21.0°C
    cpu0_vid:     +2.050 V







I still have some configuration to do to read all the voltages correctly, but the critical items are the core temperatures and the two fan speeds.







Many thanks to the lm_sensors maintainers, the ElRepo project, and everyone on the CentOS forums!
