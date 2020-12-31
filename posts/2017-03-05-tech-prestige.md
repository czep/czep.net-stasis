---
layout: post
title: Tech and Occupational Prestige
date: 2017-03-05
topics: work
---

In my post on [Age and Tech]({{ site.baseurl }}{% post_url 2016-12-24-age-and-tech %}), I explored earnings trends by age for various technical occupations using data from the [2015 American Community Survey](https://usa.ipums.org/usa/).  The analysis suggests that technical occupations offer a bright future for people of all ages.  Income in tech jobs is consistently well above national averages and the earnings curve by age remains strong.  Older workers in tech remain employed at higher rates than in other occupations.  In this post I will explore another dimension of tech occupations:  social status or occupational prestige.  How do Americans perceive technical occupations on the ladder of social status?

<!--excerpt-->

In my post on [Age and Tech]({{ site.baseurl }}{% post_url 2016-12-24-age-and-tech %}), I explored earnings trends by age for various technical occupations using data from the [2015 American Community Survey](https://usa.ipums.org/usa/).  The analysis suggests that technical occupations offer a bright future for people of all ages.  Income in tech jobs is consistently well above national averages and the earnings curve by age remains strong.  Older workers in tech remain employed at higher rates than in other occupations.  In this post I will explore another dimension of tech occupations:  social status or occupational prestige.  How do Americans perceive technical occupations on the ladder of social status?

## Socioeconomic status and occupational prestige

The term 'socioeconomic status' has a long history in social science as an attempt to measure social class.  It's a very loaded concept, in part because social class is itself a fuzzy concept.  There can be multiple dimensions to what we mean by social class, it's highly variable across time and space, and attempts to compress its meaning down to a simple measurement will always be subject to criticisms of reductionism, confounding, and incompleteness.  Still, SES is routinely employed as an important predictor of various social, psychological, and economic outcomes that express one's life chances.  Composite measures of SES typically focus on some combination of three key components: education, income, and occupational prestige.  These three components when taken together can capture a lot of what we typically consider to be social class.

While education and income are usually easy to measure at the individual level, the third component---occupational prestige---requires establishing an external reference point measuring how people classify the social status of different occupations.  For the past quarter century, researchers could map Census occupation codes to occupational prestige using scores developed by Keiko Nakao and Judith Treas as documented in [GSS Methodological Report #70](http://gss.norc.org/Documents/reports/methodological-reports/MR070.pdf).  Their work was based on a special supplement to the 1989 [General Social Survey](http://gss.norc.org/) conducted by the [National Opinion Research Center](http://www.norc.org/).

In the survey, respondents were shown an "occupational prestige ladder" consisting of boxes numbered from 1 ("Bottom") to 9 ("Top").  Respondents were then given cards with different job titles and asked to place them on the ladder based on the "social standing of the occupation".  The job titles were chosen to cover all the codes of the 1980 Census occupational classification scheme and designed to clearly describe jobs that would be familiar to the public.  Nakao and Treas then computed prestige scores for each of the Census occupations based on the average rating of the corresponding job title by the respondents in the survey, or, in cases where more than one job title mapped to the same Census occupation, by taking the mean of the average ratings.  These scores were then scaled to range from 1 to 100, with higher values representing higher "social status".

NORC again replicated the study with the 2012 GSS to bring occupational prestige measures up to contemporary standards using the 2010 Census occupational codes, as documented by Tom Smith and Jaesok Son in [GSS Methodological Report #122](http://gss.norc.org/Documents/reports/methodological-reports/MR122%20Occupational%20Prestige.pdf).  A [supplemental data file](http://gss.norc.org/Documents/other/PRESTG10SEI10_supplement.xls) was released by NORC containing several measures of prestige and SEI (socioeconomic indexes) for each of the Census occupation codes.  Further detail about their methodology is provided in [GSS Methodological Report #124](http://gss.norc.org/Documents/reports/methodological-reports/MR124.pdf).
 
## Social status of technical occupations

The following table is based on the threshold prestige score after removing rater effect, the variable PRESTG105PLUS in the supplemental Excel file.  This is a more reliable indicator than using the straight average of the prestige scores because it provides better discrimination among occupations in the middle of the prestige hierarchy and removes the rater effect (for a much more detailed description, see the afore-linked Methodology Report 124).  Since the scores themselves are only relevant in the context of other occupations, I also include the rank of the prestige score among all rated occupations (1=highest, 493=lowest).  Then, to provide a weight of this rank by population, the approximate percentile rank of persons in the occupation among all employed persons.

<style>
    table { margin: 1em; }
    th, td {
        padding: 0.25rem;
        text-align: left;
        border: 1px solid #ccc;
    }
</style>
  

| OCC Code | Label | Prestige | Rank | Percentile
|----------|-------|----------|------|------------|
|1005|Computer and information research scientists|93.6|12|2%|
|1006|Computer systems analysts|90.5|31|4%|
|1007|Information security analysts|80.2|83|16%|
|1010|Computer programmers|87.2|45|6%|
|1020|Software developers, applications and systems software|78.2|93|18%|
|1030|Web developers|83.0|68|14%|
|1050|Computer support specialists|54.6|195|39%|
|1060|Database Administrators|80.4|82|16%|
|1105|Network and Computer Systems Administrators|81.8|75|15%|
|1106|Computer network architects|91.7|20|3%|
|1107|Computer occupations, all other|61.6|163|32%|

Among our selected technical occupations, "Computer and information research scientists" has the highest prestige score at 93.6.  This ranks 12th among all occupations listed in the 2010 Census.  When ranked by population, this means Computer and information research scientists are among the top 2% of all people based on the prestige of their job.  The lowest ranked, "Computer support specialists" is still well above the median, at the 39th percentile.  It is interesting to note the perception that "support" positions are regarded as having lower social status, whereas "scientists" are typically held in high social esteem.

After scientists, "Computer network architects" have the next highest prestige score at the 3rd percentile followed by "Computer systems analysts" at the 4th percentile.  What was most striking to me was the contrast between "Computer programmers" at the 6th percentile versus "Software developers" who are much lower, at the 18th percentile.  In my [earlier post on Age and Tech]({{ site.baseurl }}{% post_url 2016-12-24-age-and-tech %}), I found that "Software developers" have the highest mean ($104,401) and median ($95,000) earnings (full-time year-round workers) among all these selected tech occupations.  "Computer programmers" are in the middle of the pack with a mean of $85,783 and median of $80,000.  Anecdotally I can attest to a preference among my peers to be known as 'Software Developers' or 'Software Engineers', as opposed to "Computer Programmers" due to a perception that the former is more skilled while the title 'programmer' perhaps implies more junior, less skilled, rote mechanical work.  Interestingly, the public at large sees things differently and so "Computer programmers" actually enjoy a higher social status than "Software developers".

Another interesting finding is that "Web developers" which had the lowest mean ($62,148) and median ($58,000) earnings among our technical occupations ranks rather highly in prestige at the 14th percentile as compared to other tech occupations that have higher earnings.  The prestige of Web developers is higher than that of "Information security analysts", whose average earnings are almost 50% higher.  My theory is that because nearly everyone interacts with websites, Web developers are one of the most visible technical occupations among the non-technical population.  Since the public is more familiar with the products of Web developers, much more so than those working in security or databases, this familiarity leads them to associate Web developers with higher social standing.




