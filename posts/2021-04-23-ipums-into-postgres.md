---
layout: post
title: How to Load IPUMS Datasets into a Relational Database
date: 2021-04-23
topics: data
---

Ten years ago I wrote a [hacky Python script](/11/tool-for-ipums-data-users.html) to read the metadata from [IPUMS](https://ipums.org/) extracts in order to load the datasets into a relational database system.  I've personally reached for this script at least once a year since I wrote it---every time new IPUMS datasets are released and often throughout the year when I need additional data for some supplemental analysis.  It's a little clunky, requires Python 2, needs a lot of extra space to uncompress the raw data files, but it still gets the job done.  But today there is a better way, mainly thanks to the IPUMS project with the development of the [ipumsr](https://cran.r-project.org/package=ipumsr) package.  An RDBMS such as [PostgreSQL](https://www.postgresql.org/) is an ideal solution for storage of Census microdata and in this post I will share an updated method that simplifies moving the data into the database.


<!--excerpt-->

Ten years ago[^1] I wrote a [hacky Python script](/11/tool-for-ipums-data-users.html) to read the metadata from [IPUMS](https://ipums.org/) extracts in order to load the datasets into a relational database system.  I've personally reached for this script at least once a year since I wrote it---every time new IPUMS datasets are released and often throughout the year when I need additional data for some supplemental analysis.  It's a little clunky, requires Python 2, needs a lot of extra space to uncompress the raw data files, but it still gets the job done.  But today there is a better way, mainly thanks to the IPUMS project with the development of the [ipumsr](https://cran.r-project.org/package=ipumsr) package.  An RDBMS such as [PostgreSQL](https://www.postgresql.org/) is an ideal solution for storage of Census microdata and in this post I will share an updated method that simplifies moving the data into the database.


The [IPUMS Project](https://ipums.org/) at the Minnesota Population Center is truly one of the shining gems in the world of quantitative social science.

I know a few purists who prefer to work directly with the microdata files provided by the Census Bureau.  I used to be one of them.  PUMS datasets released by the Census Bureau are arguably among the cleanest datasets you will ever be lucky enough to encounter in your career.  However, to read them into a statistical package requires writing your own metadata based on the documentation.  Arguably this is not a terrible burden, as it is typically a once-a-year rodeo.  If you are concerned solely with analysis of each individual year in isolation, then the only ongoing concern you may have is verifying that your read-in scripts work correctly for any subsequent releases addressing errata.  However, should you be interested in any cross-year analysis, you will soon discover that the Census Bureau's variable naming conventions are not necessarily consistent from year to year.  You will then embark on a frustrating exercise in harmonizing the variables across year.  You will also discover that value labels will also change from year to year.  The universe definitions may also vary.  Missing value codes may not line up.  The list goes on.  The IPUMS project solves all of this for you by providing harmonized datasets that unify variable names and value labels across all years.  Not only does this save an enormous amount of time, it also relieves you of the worry of introducing analysis-killing bugs when attempting to line up variables across the years.

Since the earliest days of IPUMS, the extract system would always provide you with command files for SPSS, SAS, and Stata.  Not only were these the most common statistical packages used by researchers at the time, but they also share a similar enough metadata model that variable labels and value labels can be easily translated among them.  For example, SPSS uses VALUE LABELS, SAS uses PROC FORMAT, and in Stata the "label define" command is used to attach labels to the values of categorical variables.  As R gained in popularity, there were frequent requests over the years for IPUMS to support some method of reading their extracts into R data frames.  However, R is a bit of an odd duck in the company of the aforementioned statistical packages.  R doesn't have a built-in facility for variable labels, and its closest analogue to value labels---factors---is just different enough to make facile translation from SPSS, SAS, or Stata an uneasy proposition.

The solution for many years was simply to ship a csv and have R users import that into a data frame.  Sure, it works, but without any of the corresponding metadata, it certainly felt like R was relegated to second-class citizen status.  This all changed with the introduction of the ipumsr package which finally brings R up to par with those other statistical packages when it comes to convenience of analysis of IPUMS extracts.  Reading the extracts into R is a simple two-step process:  first, parse the DDI file which contains all the relevant metadata, and then use the metadata to load the microdata:

```r
ddi <- read_ipums_ddi("path_to_extract.xml")
data <- read_ipums_micro(ddi)
```

By using the DDI file, ipumsr users actually now have access to *more* metadata than SPSS, SAS, or Stata users.  The DDI contains more comprehensive documentation on the variables including the universe specifications and user notes.

It was during my own exploration of the `read_ipums_ddi` function that I discovered this would greatly simplify my method of loading the extracts into Postgres.

## Why a database?

There are a few reasons why I take this extra step of loading the IPUMS extracts into an RDBMS.  First, it eliminates the need to load a full extract into memory as a data frame.  These datasets are "medium" sized in the sense that they don't quite constitute "big data" in the loose definition of anything that can't reasonably be stored on a personal computer.  But they're not small either, and loading a complete extract into memory will take away quite a bit of available resources on even very recent and very well-provisioned machines.  Doing so is also wasteful, especially since you are likely to only concern yourself with a very small subset of those variables in any given analysis.  My solution is to keep the full extracts in Postgres, then with each analysis I simply write a SQL query and connect to the database using RPostgres to retrieve only those variables and observations I need.

Another compelling reason to use an RDBMS is to maintain a single source of truth.  When working with data frames in R, it's all to easy to recode something and not remember how you did it, or subset cases and forget to restore the original dataset.  Personally I wouldn't even trust my own R data frames sitting in a directory I last touched 3 years ago.  I would have zero confidence that anything I did on that dataset would be reproducible.  It's much safer to simply start again with the source of truth.  This is the cleanest way to maintain confidence in the integrity of your analysis, and know that others can easily reproduce your results.

A third reason to store your microdata in an RDBMS is that you then have the freedom to use any tool that you may wish or require.  If you're a regular SPSS user but for some work you need to use SAS, then suddenly you have to go figure out why the method you used to use to convert sav files to sas7bdat isn't working this week.  The bottom line is that if you marry your data storage formats with your choice of analysis tool, you will be in for a lot of pain if and when you need to use a different tool.  I also have an annoying hobby of writing my own analysis tools, especially web-based data analysis tools, so having the data available in a database is the easiest way to serve it up within a web framework.

So given that relational databases work a lot differently than stat packages, how do you structure the microdata and metadata from IPUMS extracts in a database?  I use a very simple schema that handles just about every use case while also preserving the most valuable metadata.  Create three tables, one for variable metadata, one for value labels, and finally one for the actual microdata.

```sql

create table vars (
    var_name        TEXT,
    var_label       TEXT,
    var_desc        TEXT,
    code_instr      TEXT,
    imp_decim       INT,
    var_type        TEXT
);

create table vals (
    var_name        TEXT,
    value           INT,
    value_label     TEXT
);

```

The `vars` table contains one row per variable and includes any additional metadata you'd like, the most important being the variable label.  Here (again, thanks to the ipumsr package), I can also include the variable description from the IPUMS documentation, `code_instr` which contains notes on variable coding instructions also taken from the documentation, implied decimals and variable type information.  Note that all of these can be conveniently stored using the data type `TEXT` which is not SQL standard but should be available in other RDBMS as well.  This data type is simply wonderful and I hope to never again have to use VARCHARs.

The `vals` table is simply a concatenation of every combination of variable and value, for which a label exists.  The only caution I would make here is that we must declare a consistent data type across all labeled values and I find `INT` to be the most appropriate.  This means you can't include value labels for alphanumeric or floating point variables (I mean, you shouldn't anyway because categorical variables should be integral in the first place.)

Ok, so with a schema like this, how do we parse the extract metadata to make this easy to load?  This was the main job for my ipums\_data\_prep Python script.  It worked by parsing the SPSS syntax file which is only possible because the IPUMS extract system is always consistent in how it writes out the commands for `load data infile`, `variable labels`, and `value labels`.  But this is clearly a hack and it would be preferable to get the metadata from a more official method.  IPUMS has always shipped the DDI file along with its extracts.  DDI is an XML-based format that represents the metadata for a dataset.  Since the DDI is meant to be a source-of-truth rendition of a dataset, parsing this file would definitely be better than relying on regular expressions thrown against the SPSS file.  However, parsing XML is one of those things to which I decided long ago that I did not want to allocate any of life's precious time.  Thankfully, the IPUMS team has done so in the `read_ipums_ddi` function.  Using the return value of this function we have all the information we need to populate our database schema.

Before we dive into actually loading the data, I must mention a few caveats about setting up your IPUMS extracts to properly set them up for loading into a database.  When you get to the "Create Data Extract" after selecting your samples and variables, make sure that data format is "Fixed-width text (.dat)" and data structure is "Rectangular".  The fixed-width option will save a lot of bandwidth and disk space compared to a csv.  More than half the csv file will be commas, and I don't see much point in storing a hundred million commas on disk.  You may be tempted to select a Hierarchical extract, which will also save a lot of download time and space, but for loading to a database we actually want rectangular extracts.  The strategy here is to keep household records separate from person records in their own tables.  So, for a household extract, choose "Household records only" in the extract options.  For the corresponding person records, create a new extract, make sure it's rectangular, and then *only* select the household variables you would need to join them back to the person records.  In the case of IPUMS USA, that would be `SAMPLE` and `SERIAL`.  De-select all the others, or just ignore them when you load them into the person table later on.

Once you download your extract, don't even bother to unzip it.  Just ship it directly to your database server (if that's something other than your local machine).  Fire up a psql shell, create a database, and then create a new staging table as follows:

```sql
create table ipums_staging (input text);
```

We're going to bulk load the data file into a single text column named 'input'.

```sql
COPY ipums_staging FROM PROGRAM 'zcat /tmp/usa_NNNNN.dat.gz' WITH (FORMAT text);
```

Next we need to create the household and person tables, using the metadata extracted from the `read_ipums_ddi` function.  Load up the ipumsr package in an R session, run this function and take a quick look inside:

```r
library(tidyverse)
library(ipumsr)

ipumsddi <- read_ipums_ddi("usa_NNNNN.xml", lower_vars = TRUE)
ipumsddi$var_info

# A tibble: 71 x 10
   var_name var_label   var_desc    val_labels code_instr    start   end imp_decim var_type rectypes
   <chr>    <chr>       <chr>       <list>     <chr>         <dbl> <dbl>     <dbl> <chr>    <lgl>
 1 year     Census year "YEAR repo… <tibble […  NA               1     4         0 integer  NA
 2 sample   IPUMS samp… "SAMPLE id… <tibble […  NA               5    10         0 integer  NA
 3 serial   Household … "SERIAL is… <tibble [… "CodesSERIAL…    11    18         0 numeric  NA
 4 pernum   Person num… "PERNUM nu… <tibble [… "CodesPERNUM…    19    22         0 numeric  NA
 5 perwt    Person wei… "PERWT ind… <tibble [… "CodesPERWT …    23    32         2 numeric  NA
 6 famunit  Family uni… "FAMUNIT i… <tibble […  NA              33    34         0 integer  NA
 7 famsize  Number of … "FAMSIZE c… <tibble […  NA              35    36         0 integer  NA
 8 subfam   Subfamily … "SUBFAM in… <tibble […  NA              37    37         0 integer  NA
 9 sftype   Subfamily … "SFTYPE in… <tibble […  NA              38    38         0 integer  NA
10 sfrelate Relationsh… "SFRELATE … <tibble […  NA              39    39         0 integer  NA
# … with 61 more rows

```

The object returned from `read_ipums_ddi` is a list of various objects---mostly data frames---that are parsed from the DDI file.  The one we're most interested in is `var_info`, a tibble with all the variable metadata.

## Create table statement

Before we can parse the columns from the staging table, we need to create the actual table where the household or person records will be stored.  All we need at this point is the variable name and its SQL data type.  Run the following to print out the DDL for the create table statement:

```r
sqlcoltype <- function(var_type, imp_decim, start, end) {
  case_when(
    imp_decim > 0 ~ "DOUBLE PRECISION",
    var_type %in% c("integer", "numeric") & 1 + end - start > 9 ~ "BIGINT",
    var_type %in% c("integer", "numeric") & 1 + end - start > 4 ~ "INT",
    var_type %in% c("integer", "numeric")  ~ "SMALLINT",
    TRUE ~ "TEXT"
  )
}

sqltablespec <- function(ddi) {
  ddi$var_info %>%
  mutate(
    coltype = sqlcoltype(var_type, imp_decim, start, end),
    outstr = paste0(
      "    ",
      str_pad(var_name, 16, "right"),
      coltype,
      ifelse(row_number() == n(), "", ",")
    )
  ) %>%
  select(outstr) %>%
  format_delim(delim="\t", col_names=FALSE)
}

cat(sqltablespec(ipumsddi))
```

We need to `cat` the return value of this function so that it will print literal newlines instead of "\\n".  The output should look something like this:

    year            SMALLINT,
    sample          INT,
    serial          INT,
    pernum          SMALLINT,
    ...

I used some padding to get a nice two-column layout that's easier to read.  You might want to review the logic I'm using to determine the data type of numeric variables.  Anything with an implied decimal will be treated as DOUBLE PRECISION, but it's up to you if you want to simply keep this as INT.  Since an INT can't store anything larger than 2,147,483,647, if a variable uses more than 9 columns in the fixed-width data file, we need to read it in as a BIGINT to prevent integer overflow.  I use SMALLINTs for any numeric variables having 4 or fewer digits.  SMALLINTs can store values up to 32,767, and require only 2 bytes to store compared to 4 for a standard integer.  Since the vast majority of IPUMS variables are simple single-column variables with just a few categories, using SMALLINTs instead of INTs as the default will save a *ton* of disk space.  My household table dropped from 6216 MB down to 4543 MB when using SMALLINTs.  I wouldn't even try loading a person table without this optimization, it would be a total disk space killer.

## Insert into from staging table

So now that we've created the table, we need to parse the single column of text representing all of the variables in fixed-width format.  The query we need will look like this:

```sql
insert into person select
    nullif(regexp_replace(substr(input, 1, 4), '\D', '', 'g'), '')::SMALLINT  AS year,
    nullif(regexp_replace(substr(input, 5, 6), '\D', '', 'g'), '')::INT       AS sample,
    nullif(regexp_replace(substr(input, 11, 8), '\D', '', 'g'), '')::INT      AS serial,
    nullif(regexp_replace(substr(input, 19, 4), '\D', '', 'g'), '')::SMALLINT AS pernum,
    ...

from acs_staging_39
;

```

To generate that lovely cruft, we use this function:

```r
sqlinsert <- function(ddi) {
  ddi$var_info %>%
  mutate(
    coltype = sqlcoltype(var_type, imp_decim, start, end),
    substrexpr = paste0("substr(input, ", start, ", ", 1 + end - start, ")"),
    colexpr = case_when(
      !coltype %in% c("text") ~ paste0("nullif(regexp_replace(", substrexpr, ", \'\\D\', \'\', \'g\'), \'\')")
    ),
    outstr = paste0(
      "    ",
      str_pad(paste0(colexpr, "::", coltype), 100, "right"),
      "AS ", var_name, ifelse(row_number() == n(), "", ",")
    )
  ) %>%
  select(outstr) %>%
  format_delim(delim="\t", col_names=FALSE)
}

cat(sqlinsert(ipumsddi))

```

The basic idea is to use the start and end column positions to setup a call to SQL's `substr` function.  Unfortunately, it's never that simple so we need some extra hardening to make sure it runs without error.  We need the `regexp_replace` to remove any non-numeric characters from any variables that are supposed to be numeric.  This is here primarily to remove blank spaces.  Then we handle edge cases and return null if the entire column selection is blank.  For well-behaved variables like replicate weights, all you need is the `substr`, but for general purpose household and person variables, I'd include the full statement to ensure the COPY statement doesn't choke on unexpected input that it doesn't feel like parsing to a numeric data type.

## Vars and Vals

While Postgres churns away at those lovely string functions, get back into R and we will prepare the metadata for the vars and vals tables.  For the variable table, we get everything directly from the ipumsddi variable info, but we need to take care of some non-printable characters that will make Postgres mad.


```r
ipumsddi$var_info %>%
  select("var_name", "var_label", "var_desc", "code_instr", "imp_decim", "var_type") %>%
  distinct(var_name, .keep_all = TRUE) %>%
  mutate(
    var_label = str_remove_all(var_label, "[\t\r]"),
    var_desc = str_remove_all(var_desc, "[\t\r]"),
    code_instr = str_remove_all(code_instr, "[\t\r]")
  ) %>%
  mutate(
    var_label = str_replace_all(var_label, "\n", "\\\\n"),
    var_desc = str_replace_all(var_desc, "\n", "\\\\n"),
    code_instr = str_replace_all(code_instr, "\n", "\\\\n")
  ) %>%
  write_delim(file = "/tmp/acs_vars.dat", delim="\t", col_names=FALSE, na="\\N")
```

For vals, we have to do a little un-nesting to get the value labels.

```r
ipumsddi$var_info %>%
  filter(var_type %in% c("integer", "numeric")) %>%
  select("var_name", "val_labels") %>%
  distinct(var_name, .keep_all = TRUE) %>%
  unnest(val_labels) %>%
  write_delim(file = "/tmp/acs_vals.dat", delim="\t", col_names=FALSE, na="\\N")
```

The two resulting files can then be read into Postgres with the following:

```sql
COPY vars FROM '/tmp/acs_vars.dat' WITH (FORMAT text);
COPY vals FROM '/tmp/acs_vals.dat' WITH (FORMAT text);
```

It's a little bit of copypasta, but I think it's a lot easier to handle compared to my older script, and because it's using the DDI file and a function written by the IPUMS team, this should also be a more reliable way of preparing IPUMS extracts for loading into your favorite RDBMS.

[^1]: When I first wrote this, it said "A few years ago", because in my mind I recall that it was roughly a few years ago that I wrote the script.  When I actually looked it up to discover that it was in fact *ten years ago* I was once again shocked by how strangely inaccurate is my personal recollection of the passage of time.


