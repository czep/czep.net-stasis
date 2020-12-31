---
layout: post
title: How not to tank a perfectly good power analysis
date: 2020-04-26
topics: statistics
---

Power analysis is one of the most fundamental data science procedures and a prerequisite for anyone doing A/B testing.  When reviewing the power analyses of junior data scientists I usually look first at how they estimate the variance of their target metric.  This is one of the trickier aspects of the process to get right, and it's usually where they spend most of their time.  In our haste to get the variance right, it's easy to overlook another even more critical piece of the estimate: your target population size, specifically, how many unique experiment assignments you will expect over time.

<!--excerpt-->

<style>
  code[class*="language-"],
  pre[class*="language-"] {
    font-size: 14px;
    line-height: 1.3;
}
</style>

Power analysis is one of the most fundamental data science procedures and a prerequisite for anyone doing A/B testing.  When reviewing the power analyses of junior data scientists I usually look first at how they estimate the variance of their target metric.  This is one of the trickier aspects of the process to get right, and it's usually where they spend most of their time.  In our haste to get the variance right, it's easy to overlook another even more critical piece of the estimate: your target population size, specifically, how many unique experiment assignments you will expect over time.

## Power and sample size




Can you spot two flaws in the following power analysis summary?


> Our target metric has a baseline mean of 4.0 and a standard deviation of 18.0.  The subject of the experiment will be logged in users.  We will launch the experiment if the treatment group increases our target metric by 2%. With 50% of users allocated to each of control and treatment, we will need 794,700 users in each group.  Our daily active user count is 60,000. We will assume equal variance across control and treatment.  In order to reach 80% power to detect a 2% change with a 95% confidence level, we should run our experiment for 27 days.

```r
mde = 0.02
baseline_mean = 4.0
baseline_sd = 18.0
pow <- power.t.test(
  n=NULL,
  delta = mde * baseline_mean,
  sd = baseline_sd,
  sig.level=0.05,
  power=0.80,
  alternative="two.sided",
  strict=FALSE
)

> pow

     Two-sample t test power calculation

              n = 794700
          delta = 0.08
             sd = 18
      sig.level = 0.05
          power = 0.8
    alternative = two.sided

NOTE: n is number in *each* group

> pow$n / 60000 * 2
[1] 26.49

```

The first problem is day of week effects.  We rounded up to 27 days to reach the target sample size in each group.  However, unless you have strong evidence otherwise, you should conduct experiments in numbers of complete weeks.  Day of week effects can introduce bias in the results because typically weekday users will behave very differently from weekend users.  Even if you have enough power to reach your desired sample size in just 3 days, you should still run the experiment for a full week to ensure that you will expose the treatment to different kinds of users.  This is a smaller problem with a 4 week experiment, but there's still a more serious issue lurking in our experiment plan.

Let's say that you're confident in your calculations of the baseline mean and variance.  But you run the experiment and after 4 weeks you are nowhere near your expected sample size.  Why?

The problem occurs at the very last step of the analysis, one that we usually take for granted as the simplest part of the procedure after the more difficult task of estimating the mean and standard deviation are behind us.  Satisfied that our input parameters are correct, we plug then into our power calculation formula to solve for the required sample size.  At last we have our answer!  Now let's just simply divide by our daily active user count and voila!  We're all set to launch the experiment.

And here's the reason why things may take a lot longer than you expect.  On day one of the experiment, you did indeed see 60k unique users and they were correctly randomized half into the control and half into the treatment.  On day two, again you saw 60k unique users, but according to your experiment logs, there were only 45,000 new assignments!  On day three, it's even worse, only 30,000 new assignments into the experiment, just half of what you expected.  Going into the second week, while still seeing 60k unique users logging in each day, you're only seeing 6,000 new experiment assignments.  All that work we did for the power analysis is now worthless, because at this rate it will take 4 months to reach the target sample size that you estimated (and told your team) would happen in just 4 weeks.

I hope by now you can see the flaw.  The subject of our experiment is logged in users.  How many of your users login every day, or at least multiple times per week?  In a user level experiment, they will only be assigned to the experiment once (if not, then you have much bigger problems with your experiment design).  The flaw was dividing the required sample size by average daily unique users without taking into consideration how often those users overlap on multiple days.  Although this certainly varies depending on your userbase, it's not uncommon to see that a large fraction of your daily uniques are logged in every day.

In this case, a quick check of your monthly unique user count would have confirmed whether it's on the same scale as your DAUs times 30, or much more likely, that it's substantially lower.  So what's the correct way to estimate the run time of the experiment?  We have a circular situation here: we can't estimate the run time without knowing the number of uniques you'd see.  But to estimate the number of uniques, you need to know the run time over which to calculate them.

In practice, this isn't too difficult since, again, you are ideally running experiments in increments of complete weeks and typically you'd have an upper bound (say 3 months) beyond which it's simply impractical to keep an experiment running without making a decision.  So one approach is to calculate the cumulative number of uniques for each number of weeks from 1 to 12.  For example, based on a table that records user login events, the following query using PostgreSQL's `generate_series` function will count the number of unique users you would see in each complete week of Q1 2020.  (Other databases will have something similar or you could just hard-code the 12 weeks.)

```sql
select
    weeks.week,
    sum(case when users.first_week <= weeks.week then 1 else 0 end) as uniqs
from
(
    select
        user_id,
        min(date_trunc('week', login_date)) as first_week
    from
        user_logins
    where
        login_date BETWEEN '2020-01-06'::date AND '2020-04-05'::date
    group by 1
) users
cross join
(
    select generate_series(date '2020-01-06', date '2020-04-05', '1 week') as week
) weeks
group by 1
order by 1
;
```

Note that this will only be accurate if your forecast user counts in the next three months are going to be stable.  If you're rapidly gaining (or losing) users then you'll need to make some judgment calls as to how many unique users you will expect to see.  Watch also for seasonal trends.  If you're entering a peak season, your unique user count will not decay as much as it would if you are leaving a peak season.  Peak seasons tend to add more new users as well as bring back more occasional users, so you'll find a higher ratio of MAU to DAU.  Thus, as the experiment runs, the fraction of DAUs that result in new experiment assignments will stay higher and you'll reach your target sample size earlier.  In a downward seasonal trend, a larger share of your DAUs will be your highly active user base, so each day a smaller and smaller number of new assignments will enter the experiment.

## Feedback loop on target metric mean and variance

Depending on how your target metric is measured, you may need to recalculate the mean and variance across different time periods.  If your experiment measures something that will accumulate over time, such as the number of times a user takes some action, then the mean and variance may change substantially for different experiment run times.  If you calculate the mean and variance assuming a two week experiment, but your sample size calculation suggests you will need 8 weeks, you will need to confirm that the mean and variance will remain proportionally stable over the longer run time.

It doesn't so much matter that the mean and variance change, what matters is that the ratio of variance to mean stays roughly the same.  Consider above where our baseline mean is 4.0 and the standard deviation is 18.0.  The standard deviation is 4.5 times the mean.  If for a longer experiment run time, the mean increases to 10.0, then your power calculation will only be valid if the standard deviation increases proportionally, to 45.0.  If the variance changes _at a different rate_ relative to the mean, then you must recalculate the sample size estimate.  This feedback loop may cause you to iterate several times, first calculating the mean and variance over N weeks, then estimating the sample size required and recalculating mean and variance if the new number of weeks results in a different ratio of variance to mean.

## Alternative experiment designs

As an alternative to this mess you could consider a session-level experiment design, where the subject is each login session rather than each user.  In this case, randomization occurs for each session.  This will increase your power over the same run time because the number of experiment assignments will not decay due to repeat users.  The sample size estimate will be simpler because your additive DAU count will be a good proxy.  However, consider what this means for the user experience.  A user on day two may be allocated to a different treatment group than they saw on day one.  If your experiment is a new feature, this could be very confusing for users who will see the feature appearing and disappearing on different days.

It's not a good idea to base your experiment design on how much simpler it makes your power calculation!  Definitely consider the user experience when deciding whether the experiment randomization should occur at the user or session level.

## The perils of unnecessary precision

Lastly, remember that the goal of the power calculation is to provide guidance.  The sample size estimate doesn't have to be precise to the day as long as you're reasonably close.  It's far more likely that your observed effect size will be wildly different from your hypothesis.  After all, you really don't know what to expect from your users which is why you're running an A/B test in the first place.  Underestimating by a week is not going to tank your analysis, but underestimating by _4 months_ will have your team seriously questioning what you are doing.

On the problem of effect size, this is another situation where you should prepare some alternative scenarios.  Where did you come up with the 2% launch criteria?  Is this based on previous experiments with similar results?  A research survey?  Industry precedent?  A Product Manager's hunch?  Since we usually have no real clue how much impact our treatment group will have, you should always prepare your power analysis summary with a range of hypothetical Minimum Detectable Effect sizes.  Typically, I would recommend 1%, 2%, 5%, and 10%.  This provides a nice bounding box on how quickly (or whether at all) you can detect a small, medium-sized, or large effect.  If you have enough power to nail a 1% change in two days, then congratulations, you can pretty much stop here and launch the experiment now because you have plenty of users.  If, on the other hand, a 10% change will require a 270 day experiment, you're going to have to have a serious talk with your team about whether you should be experimenting at all.  Knowing what this bounding box looks like for your experiment will greatly help determine what you should expect to learn from your experiment.





