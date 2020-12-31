---
layout: post
title: Wireless Linux at boot without X
date: 2011-09-02
topics: linux
---
Since most servers require a constant, fast, reliable network connection, it's no surprise that they are typically connected via wired Ethernet.  And, since most wireless users are mobile, it stands to reason that the majority of wireless configuration tools are wrapped in a graphical interface activated by a windowing system.  In a standard linux installation where a wireless adapter is present, the adapter can be activated at boot time but the connection to the wireless access point is not negotiated until the user establishes a desktop session.


<!--excerpt-->

Since most servers require a constant, fast, reliable network connection, it's no surprise that they are typically connected via wired Ethernet.  And, since most wireless users are mobile, it stands to reason that the majority of wireless configuration tools are wrapped in a graphical interface activated by a windowing system.  In a standard linux installation where a wireless adapter is present, the adapter can be activated at boot time but the connection to the wireless access point is not negotiated until the user establishes a desktop session.







If for [some crazy reason](/11/building-a-home-pc-part-1-motivation.html) you need a constant, fast, reliable network connection but don't have a convenient Ethernet port nearby, or you simply want to reduce the number of cables strewn about the house, it is still possible to configure a wireless interface without a GUI session.







wpa_supplicant is a client program that negotiates connections to wireless access points secured with WPA.  There are a few varieties of security protocols but the most common for a typical home router should be WPA2-PSK.  We have to make a few configuration changes in order to have the wireless adapter available at boot time.







First, generate an encrypted key based on your wireless router's passphrase.  Do this using wpa_passphrase followed by your router's name and passphrase, eg:







    # wpa_passphrase your-ssid "your passphrase here"







Next, edit /etc/wpa_supplicant/wpa_supplicant.conf







    ctrl_interface=/var/run/wpa_supplicant
    ctrl_interface_group=wheel
    ap_scan=1
    network={
        ssid="your-ssid"
        proto=RSN
        key_mgmt=WPA-PSK
        pairwise=CCMP TKIP
        group=CCMP TKIP
        psk=big long string output from the wpa_passphrase command
    }







The psk option is the output of running wpa_passphrase.  This is a 256-bit key that wpa_supplicant will use to authenticate with your router.  Note that this data is a bit sensitive so make sure that wpa_supplicant.conf is owned by root with mode 600.







Next, make sure your wireless adapter is configured properly.  In CentOS 6, the device name is wlan0.  Edit /etc/sysconfig/network-scripts/ifcfg-wlan0







    DEVICE="wlan0"
    HWADDR="your MAC address here"
    NM_CONTROLLED="yes"
    ONBOOT="no"
    BOOTPROTO=dhcp
    TYPE=Wireless
    WPA=yes








We don't want to activate this on boot, since wpa_supplicant will not be available yet.  We will bring up the interface manually in rc.local.







Add this to the end of /etc/sysconfig/network-scripts/ifup-wireless







    if [ "$WPA" = "yes" -a -x /etc/init.d/wpa_supplicant ]; then
    /sbin/service wpa_supplicant start
    fi







Next, edit /etc/sysconfig/wpa_supplicant and set the following:







    INTERFACES="-iwlan0"
    DRIVERS="-Dwext"








Now, running "ifup wlan0" will first start wpa_supplicant, then bring up the interface, then request an IP address.  Add the following line to /etc/rc.d/rc.local







    /sbin/ifup wlan0







At this point everything should be configured such that your wireless connection is established automatically after booting up.  However, before you disconnect the monitor, note that if you blindly run a yum update, you might accidentally blow away your configuration (like I did).







    yum provides "*/ifup-wireless"
    initscripts-9.03.17-1.el6_0.1.x86_64 : The inittab file and the /etc/init.d scripts








If you update the initscripts, you will lose the changes made to ifup-wireless.  Don't reboot before restoring the change otherwise your box will be cutoff and you'll have to plug in the monitor to get wireless working again.
