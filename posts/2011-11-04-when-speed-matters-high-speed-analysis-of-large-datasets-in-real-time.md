---
layout: post
title: When Speed Matters High-Speed Analysis of Large Datasets in Real Time
date: 2011-11-04
topics: data
---
In this series of posts, I will describe the technical foundations of a data analysis system that can support the goal of high-speed analysis of large datasets in real time.  The focus will be on developing a system that can power a web application, using generic datasets.  This means we cannot make any assumptions about the datasets that will be used, since we want a general purpose application that can work with a variety of data.  This kind of optimization is not hard, but it can be tricky, and it will involve cost-benefit trade-offs for which real-world benchmarks are the best kind of success metric.  In the end, we will have a basic blueprint for a data analysis system that can analyze data with blazing speed.

<!--excerpt-->

Let's say you have a dataset with a few million rows on which you intend to perform some analysis and return the results to users of a web application. If you can store the entire dataset in memory, the speed with which you can access the data and perform the necessary computations on it should be sufficient to fall within a reasonable response time. However, it is not very practical to perpetually reserve the gigabytes of memory that may be required, and with sufficiently large datasets it will not be possible at all. If you can precompute and cache the results, then your results can easily be returned to users with a simple lookup. This is, after all, the basic premise of an OLAP cube. Unfortunately, unless your dataset has only a small collection of variables or your users are only interested in a limited set of analyses, you are unlikely to be able to anticipate all the uses to which your dataset can be put. Thus, to be most flexible, you will somehow need to provide fast access to the raw data.







In a typical scenario where the dataset has been loaded into an RDBMS or a statistical package, the data will reside on a hard disk. Perhaps it will be spread across multiple physical disks located in multiple physical machines, but it will still be subject to the same slow IO for which hard disk storage is infamous. Using locally attached SSDs will speed things up somewhat, but without additional optimization, it is doubtful that standard query tools will be able to retrieve a large dataset in a reasonable time frame to be considered usable in a web application.







As a case study, consider the 5% sample of the 2000 US Census, a dataset with 14,081,466 observations. On my laptop, a basic proc freq in SAS will take about 5 minutes to complete. On another machine where I have the dataset in PostgreSQL on an SSD, a full table



scan takes about 50 seconds. This is a far cry from the magical 7 second response time to which a web application should adhere if you want your users to stick around.







The <a href="http://usa.ipums.org/usa/index.shtml">IPUMS project</a> provides an <a href="http://usa.ipums.org/usa/sda/">online data analysis system</a> with access to most of the datasets that they make available. A basic tabulation of the 2000 5% sample will return in under a second. In all likelihood, this is a pre-computed result so the system is not making a pass over the entire raw dataset. But tabulation is only the beginning. From their website you can run complex crosstabs, create custom variables, use various weights, and run t-tests, anova, correlations, and regressions. It is not possible that they have pre-computed every possible analysis that the system makes available, and yet, response times even for complex procedures remain very fast. How do they do it?







The system they use is powered by <a href="http://sda.berkeley.edu/index.html">SDA</a> developed at UC Berkeley. Speed is one of the principal design goals of their software. From the main page: "SDA was designed to produce analysis results very quickly -- within seconds -- even for large datasets with millions of cases and thousands of variables." They go on to explain that there is no special hardware required, the system runs on basic commodity linux servers. They do not load the datasets in RAM, nor do they pre-compute results.







SDA is not free software and the licensing costs are well above the wallet constraints of the typical hobbyist or startup (think: SAS or Oracle here).  Since IPUMS is a licensee, it costs nothing to IPUMS users to use the SDA system on IPUMS datasets. This is probably the cheapest and easiest way to analyze Census data today. You don't need to download anything, the results are fast, the system itself, albeit a bit clunky, is easier to learn than a stat package, and the feature set is quite extensive.







But let's return to the question: how do they do it? Since SDA is not free, the source code is not publicly available, but we can glean some insights into the guts of the system from the available documentation. The <a href="http://sda.berkeley.edu/document.htm">SDA Archive Developer's Guide</a> provides a high-level overview of the structure of an SDA dataset. Basically, there is a metadata directory and a variables directory that contains one binary file of raw data for each variable. From this high-level overview, we can now begin to speculate on the low-level internals that make high-speed data analysis possible.







In this series of posts, I will describe the technical foundations of a data analysis system that can support the goal of high-speed analysis of large datasets in real time.  The focus will be on developing a system that can power a web application, using generic datasets.  This means we cannot make any assumptions about the datasets that will be used, since we want a general purpose application that can work with a variety of data.  This kind of optimization is not hard, but it can be tricky, and it will involve cost-benefit trade-offs for which real-world benchmarks are the best kind of success metric.  In the end, we will have a basic blueprint for a data analysis system that can analyze data with blazing speed.
