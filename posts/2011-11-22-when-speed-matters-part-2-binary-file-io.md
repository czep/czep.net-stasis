---
layout: post
title: When Speed Matters Part 2  Binary File I/O
date: 2011-11-22
author: czep
topics: data
---
A look at the kernel internals for handling file I/O operations.

<!--excerpt-->

In [Part 1](/11/when-speed-matters-high-speed-analysis-of-large-datasets-in-real-time.html), we introduce some of the initial design considerations impacting a system for high-speed analysis of large datasets.  In particular we're interested in this type of scenario:



* the user expects response times no longer than 7 seconds



* the data is too large to fit in main memory, or doing so would be too costly (no memcached)



* the analysis cannot be entirely pre-computed (no OLAP)



* an RDBMS or statistical package is not able to meet the expected response times





The example dataset we're using is the 2000 US Census 5% sample, with 14,081,466 observations.  I'm not able to come any where near 7 seconds with either SAS or PostgreSQL, despite using SSDs and tuning both systems for fast sequential reads.  Databases and statistical packages are general purpose tools, and as such they are built to be robust in a variety of situations, where safety is the primary concern, not speed.







Our case study is the <a href="http://sda.berkeley.edu/index.html">SDA system</a> from UC Berkeley, which can perform some fairly complex processing of this Census dataset very rapidly.  Speed is one of SDA's explicit design goals, and while the system is closed-source, we do have some insight into how it operates.  Rather than maintaining one monolithic dataset, SDA splits each variable into individual binary files.  When structured this way, we can write custom routines that make efficient I/O calls to read this data from disk.







Most of the available Census microdata are represented as nominal categorical variables where integral values are assigned to categories for convenient processing.  For example, the variable SEX has two possible values:  1 for Male, and 2 for Female.  The use of integers is simply to avoid wasting space by having 14 million repetitive text strings.  A file containing 14,081,466 4-byte integers will take up 54MB of disk space (as measured by ls -lh).  Technically, we don't even need 4 bytes because the entire file only contains values of 1 and 2.  We could compress this down to 1 byte chars if we wanted.  For that matter, we could just pack each observation into a single bit, and end up with a 14MB file instead.  But 4-byte ints are convenient to work with, and the extra overhead of converting their compressed form to integers anytime we want to process the data may wipe out the gains from saving space.  We'll explore various compression trade-offs later in this series.







The C Standard Library provides the fread and fwrite functions for operating on file streams.  In version 2.8 of the GNU C library, the <a href="http://www.gnu.org/software/libc/manual/html_node/Block-Input_002fOutput.html">function declaration for fread</a> is as follows:



```c

size_t fread (void *data, size_t size, size_t count, FILE *stream)

```



To sequentially read integers from a binary file, the simplest approach is to call fread to successively obtain 4 bytes from the file and read them into a pointer to integer:







```c
int *data;
size_t items;
FILE *fp;

fp = fopen(filename, "rb");
data = (int *) malloc(4);
while ( !feof(fp) && !ferror(fp) ) {
    items = fread(data, 4, 1, fp);
}
fclose(fp);
```



fread will return the number of items it successfully reads, so you will want to check the return value and handle any error conditions.  Compile this code and time it using /usr/bin/time -v to see a verbose output with a lot of useful information not only about the process run time but also other details regarding the resources used by the process while it was running.  Note that calling time without the path will use the bash built-in time command which provides less functionality than the GNU version in /usr/bin.  Before timing, make sure to clear the file system cache first by running this command (on Linux):



    sync; echo 3 &gt; /proc/sys/vm/drop_caches




If you don't do this, the file may already be cached in main memory, and the timing results will not be measuring disk I/O at all.







The two most important data points reported by time are the User time and System time reported in seconds with two decimal places.  User time is the time spent executing your code, including any library functions used in your code.  System time is time spent in the kernel by system calls executing on behalf of your user code.  fread is a C library function, so executing calls to fread take place in user mode.  However, since fread needs to make system calls to perform the actual file I/O (on Linux it will call the read function defined in unistd.h), the kernel will take over when these system calls are made and the time spent executing the actual I/O will count toward System time.







On my system, the average of 30 runs (clearing the cache between each run), is 0.40 seconds of User time and 0.03 seconds of System time.  Take a few seconds to marvel at what just happened here.  Our database server takes a leisurely 50 seconds to complete a full table scan whereas with direct file I/O in C, we are able to accomplish this feat in less than half a second.  Of course, we haven't done any actual processing of this data, but this still serves to prove that datasets of this size can be accessed quickly enough to satisfy the expectations of real-time analysis.







For the next installment, we will take a closer look at how the actual I/O is taking place to see if we can take full advantage of the optimizations that are available.  Specifically, we will explore buffering that is done by the C Standard Library, and page cache readahead that is done by the Linux kernel.
