---
layout: post
title: Tool for IPUMS data users
date: 2011-10-06
topics: statistics
---
I am happy to announce the release of my [IPUMS data prep](/data/ipums_data_prep/) tool to help users of IPUMS data load their extracts into their own database systems.




<!--excerpt-->

I am happy to announce the release of my [IPUMS data prep](/data/ipums_data_prep/) tool to help users of IPUMS data load their extracts into their own database systems.







The <a href="http://www.ipums.org/">IPUMS project</a> provides an invaluable resource for researchers through access to a massive trove of population data including the <a href="http://www.census.gov/">US Census</a>, the <a href="http://www.census.gov/acs/www/">American Community Survey</a>, the <a href="http://www.bls.gov/cps/">Current Population Survey</a>, and numerous censuses from around the world.







IPUMS extracts are accompanied by machine-readable syntax files for loading the data into SPSS, SAS, and Stata, but users without access to one of these statistical packages are on their own to manually parse the data.  I wrote [IPUMS data prep](/data/ipums_data_prep/) as a Python script to help prepare IPUMS dataset extracts for loading into a relational database like <a href="http://www.postgresql.org/">PostgreSQL</a> or <a href="http://www.mysql.com/">MySQL</a>.







I hope that this tool will help broaden the utility of IPUMS by making the data accessible to a wider population of users.
