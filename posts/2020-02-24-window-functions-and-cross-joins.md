---
layout: post
title: Using window functions and cross joins to count events above a threshold
date: 2020-02-24
topics: data
---

I haven't written a SQL post since [Generating post-hoc session ids in SQL](https://czep.net/16/session-ids-sql.html).  I don't ordinarily think of SQL as good candidates for blog posts because to me SQL is just boring.  I do use it everyday though, and I've certainly internalized a lot of handy tricks. Today I'd like to share one of those rare moments when I sat back and thought to myself, "wow this query is beautiful!"  The solution involved using not just one, but two cross joins, and a window function to count the number of events occurring at or above each level of a score.

<!--excerpt-->

I haven't written a SQL post since [Generating post-hoc session ids in SQL](https://czep.net/16/session-ids-sql.html).  I don't ordinarily think of SQL as good candidates for blog posts because to me SQL is just boring.  I do use it everyday though, and I've certainly internalized a lot of handy tricks. Today I'd like to share one of those rare moments when I sat back and thought to myself, "wow this query is beautiful!"  The solution involved using not just one, but two cross joins, and a window function to count the number of events occurring at or above each level of a score.  For the code samples I'll use [PostgreSQL](https://www.postgresql.org/), but I will stick to ANSI SQL whenever possible. Postgres is an excellent RDBMS both for local development and for production.

## Intro to window functions

Window functions can be used to solve a wide variety of problems when you need to reference an aggregate value alongside each row of your dataset.  The old school way of solving this is a form of self join, where you calculate an aggregate value on some combination of columns, then join it back to your original dataset so that you can reference the aggregate value.  In the usual textbook example[^1]: given a dataset of employees with their department and salary, you'd like to identify the employees with the highest salary for each department.  The self join method would work like this:


<style>
code[class*="language-"],
pre[class*="language-"] {
    font-size: 14px;
    line-height: 1.3;
}
</style>



```sql
select
    e.name,
    e.department,
    e.salary
from
    employees e
join
(
    select
        department,
        max(salary) as max_salary
    from
        employees
    group by 1
) dept_max
    on e.department = dept_max.department
where
    e.salary = dept_max.max_salary
```

This is a perfectly legitmate solution and indeed works well with reasonably sized datasets.  However, the join can be costly and in very large datasets you could exhaust all available memory.  Window functions let you accomplish the same thing but without the need to join on a sub-query.

```sql
select
    name,
    department,
    salary
from
(
    select
        name,
        department,
        salary,
        max(salary) over (partition by department order by salary range between unbounded preceding and unbounded following) as max_salary
    from
        employees
) e
where
    salary = max_salary
;
```

Note that window functions do introduce extra computation and also require a fair amount of memory.  There are certainly cases where the self join method will perform better than the window function, but as a general rule, at scale, window functions will be more optimal.

## Intro to cross joins

Cross joins are usually avoided due to their tendency to absolutely crush your database, but they can actually be useful as a technique to build templates to fill in gaps of missing data.  One of the most common use cases that I run into where cross joins are useful is when I need to generate a report with dates and need to ensure that each day appears in the output even if it doesn't appear in the dataset.  For example, you have a table of orders and want to report the sum of sales on each day.  Consider this sample dataset:

```sql
create table orders as
select date '2020-02-01' as day, 10 as sales union all
select date '2020-02-01' as day, 10 as sales union all
select date '2020-02-01' as day, 10 as sales union all
select date '2020-02-02' as day, 10 as sales union all
select date '2020-02-03' as day, 10 as sales union all
select date '2020-02-05' as day, 10 as sales union all
select date '2020-02-05' as day, 10 as sales
;
```

Now let's get the sum of sales for each day:

```sql
select
    day,
    sum(sales) as sales
from
    orders
group by 1
order by 1
;
    day     | sales
------------+-------
 2020-02-01 |    30
 2020-02-02 |    10
 2020-02-03 |    10
 2020-02-05 |    20
(4 rows)
```

Oops, we missed the 4th.

If you're certain that you have at least one order every day then this query is not likely to get you into trouble.  But, in situations where you can't guarantee that each day appears in your result set, this pattern will leave annoying gaps for those days where there weren't any sales.  Ideally, we'd want to include those days in our report, with a sum of 0 for that day.  We can do this by first generating a template that contains all the days we care about, then left joining from that template to the aggregate report.


```sql
with template as (
    select date(generate_series(date '2020-02-01', date '2020-02-05', '1 day')) as day
),
orders as
(
    select
        day,
        sum(sales) as sales
    from
        orders
    group by 1
)
select
    t.day,
    coalesce(o.sales, 0) as sales
from
    template t
left join
    orders o
        on t.day = o.day
order by 1
;
    day     | sales
------------+-------
 2020-02-01 |    30
 2020-02-02 |    10
 2020-02-03 |    10
 2020-02-04 |     0
 2020-02-05 |    20
(5 rows)
```

Wait, that's just a left join and I thought this was supposed to be about cross joins?  What if, in addition to `day`, there is another variable that you need to include in your template?  For example, if you also have a `city` variable and you want the output to show every combination of both day and city, this is where a cross join can enter the picture.

```sql
create table days as
select generate_series(date '2020-02-01', date '2020-02-05', '1 day') as day

create table cities as
select 'Chicago' as city union all
select 'New York' as city union all
select 'San Francisco' as city

with template as (
    select
        d.day,
        c.city
    from
        days d
    cross join
        cities c
) select * from template
;
          day           |     city
------------------------+---------------
 2020-02-01 00:00:00-08 | Chicago
 2020-02-01 00:00:00-08 | New York
 2020-02-01 00:00:00-08 | San Francisco
 2020-02-02 00:00:00-08 | Chicago
 2020-02-02 00:00:00-08 | New York
 2020-02-02 00:00:00-08 | San Francisco
 2020-02-03 00:00:00-08 | Chicago
 2020-02-03 00:00:00-08 | New York
 2020-02-03 00:00:00-08 | San Francisco
 2020-02-04 00:00:00-08 | Chicago
 2020-02-04 00:00:00-08 | New York
 2020-02-04 00:00:00-08 | San Francisco
 2020-02-05 00:00:00-08 | Chicago
 2020-02-05 00:00:00-08 | New York
 2020-02-05 00:00:00-08 | San Francisco
(15 rows)
...
```

And that's the magic of the cross join.  Now you can start with this template and left join it to a summary of sales grouped by day and city, and you'll be able to retain all combinations even if there were no sales for that particular row.


## Counting events above a threshold

Here is the generalization of a specific problem that I faced last week.  It's not a terribly common pattern, but you are likely to encounter some variation of this at some point in data analysis.  I could extend the example above where we have a dataset of day, city, and sales, but financial examples are boring and make me look too corporate.  Of course, I am too corporate but let's leave that unfortunate fact aside for now.  Let's turn to the domain of incident response.  We have a table of events where each event is represented by a day, a city, and a severity score ranging from 1 to 100.  The problem is to count, for each day, the number of cities in which an event occurred at or above each possible severity score.

Why would this be useful?  Let's say you'd like a line chart using multiple series with date on the x-axis and number of cities on the y-axis, where each series is the threshold.  Each line on the graph would be a score, say 75, and the line would trace the daily count of the number of cities with an event at 75 or above.

The general problem holds for any situation where you have any two dimensions and some metric value.  One of the dimensions could be temporal, but it doesn't need to be, it's just easier to think of the output that way.  The metric value needs to have reasonably high cardinality and for which you'd like to count the number of combinations of the dimensions that occur at or above every possible value of the metric.  If the metric value has low cardinality then there's a very easy short cut which we'll discuss in a moment.  But first, here is a sample dataset.


```sql
with events as (
    select * from (
        select '2019-01-01'::date as date
    ) a
    cross join
    (
        select 'Chicago' as city, 1 as score union all
        select 'Chicago' as city, 2 as score union all
        select 'Chicago' as city, 3 as score union all
        select 'Los Angeles' as city, 1 as score union all
        select 'Los Angeles' as city, 1 as score union all
        select 'New York' as city, 2 as score union all
        select 'New York' as city, 2 as score union all
        select 'San Francisco' as city, 2 as score union all
        select 'Seattle' as city, 5 as score
    ) b
)
select * from events
;
    date    |     city      | score
------------+---------------+-------
 2019-01-01 | Chicago       |     1
 2019-01-01 | Chicago       |     2
 2019-01-01 | Chicago       |     3
 2019-01-01 | Los Angeles   |     1
 2019-01-01 | Los Angeles   |     1
 2019-01-01 | New York      |     2
 2019-01-01 | New York      |     2
 2019-01-01 | San Francisco |     2
 2019-01-01 | Seattle       |     5
(9 rows)
```

Our desired output is, for each day, and each score, the number of cities in which at least one event occurred at or above that score.  For our sample data, it would look like this:

```
date       score  at_or_above
========== =====  ===========
2019-01-01   1          5
2019-01-01   2          4
2019-01-01   3          2
2019-01-01   4          1
2019-01-01   5          1
```

All 5 cities have an event of score 1 or higher.  All cities except for Los Angeles have an event of at least 2.  Chicago and Seattle both reach 3 or higher, while only Seattle reaches 4 or 5.  How would you generate the SQL to solve this?

Let's decompose the problem by first ignoring the date so that we have a dataset of events with only city and score.  (This is actually the case in our sample dataset because they all have the same date).  This is also a good way to use a divide and conquer strategy when decomposing an analytical problem:  strip away the outer layers of a problem so you can solve the core of it first, then gradually layer in each successive group once you've got the foundation working.


```sql
create table events as
select 'Chicago' as city, 1 as score union all
select 'Chicago' as city, 2 as score union all
select 'Chicago' as city, 3 as score union all
select 'Los Angeles' as city, 1 as score union all
select 'Los Angeles' as city, 1 as score union all
select 'New York' as city, 2 as score union all
select 'New York' as city, 2 as score union all
select 'San Francisco' as city, 2 as score union all
select 'Seattle' as city, 5 as score
;
```

Let's back up even further.  From the output it looks like we want one row for each score.  Ordinarily you'd accomplish this by grouping by that column. We can see what we get by counting distinct cities for each score.

```sql
select
    score,
    count(distinct city) as cities
from
    events
group by 1
order by 1;
 score | cities
-------+--------
     1 |      2
     2 |      3
     3 |      1
     5 |      1
(4 rows)
```

Grouping by score allows us to use aggregate functions for all the rows at each value of score.  For example, we see there are 2 cities that have an event with a score of 1.  However, our goal is to count the cities that have a score of 1 *or higher*.  We can't do this with a simple `group by` because that only gives us the ability to operate on each value of score independently.

For each score, we need a way to reference all the cities with a score at or above that value.  One way to accomplish this is with a self join: joining the events table back to itself so that for each score, we include all cities with scores at or above that value.  From this, we can group and count the distinct number of cities at or above each score:

```sql
select
    score,
    count(distinct city) as at_or_above
from
(
    select
        e1.score,
        e2.city,
        e2.score as score2
    from
        events e1
    join
        events e2
            on e2.score >= e1.score
) e
where
    score2 >= score
group by 1
order by 1
;
 score1 | at_or_above
--------+-------------
      1 |           5
      2 |           4
      3 |           2
      5 |           1
(4 rows)
```

Self joins are fine for very small tables, but what if you have a million rows?  To be scalable we need a way to do this in one pass over the table.  Also note that a score of 4 doesn't appear in the results, because there are no values of 4, only 5.  Ideally, we still want to show that there is one city with a score at or above 4.

There's another way we can solve this without having to do a self join.  We can brute force the calculation by using aggregate functions to create new columns for each value of score:

```sql
select
    sum(case when max_score >= 1 then 1 else 0 end) as at1,
    sum(case when max_score >= 2 then 1 else 0 end) as at2,
    sum(case when max_score >= 3 then 1 else 0 end) as at3,
    sum(case when max_score >= 4 then 1 else 0 end) as at4,
    sum(case when max_score >= 5 then 1 else 0 end) as at5
from
(
    select
        city,
        max(score) as max_score
    from
        events
    group by 1
) a
;
 at1 | at2 | at3 | at4 | at5
-----+-----+-----+-----+-----
   5 |   4 |   2 |   1 |   1
(1 row)
```

These are exactly the results we're looking for, we just have to transpose them which we can do by manually unioning together the results of 5 separate queries:

```sql
with t as (
    select
        city,
        max(score) as max_score
    from
        events
    group by 1
)
select 1 as score, sum(case when max_score >= 1 then 1 else 0 end) as at_or_above from t union all
select 2 as score, sum(case when max_score >= 2 then 1 else 0 end) as at_or_above from t union all
select 3 as score, sum(case when max_score >= 3 then 1 else 0 end) as at_or_above from t union all
select 4 as score, sum(case when max_score >= 4 then 1 else 0 end) as at_or_above from t union all
select 5 as score, sum(case when max_score >= 5 then 1 else 0 end) as at_or_above from t
;
 score | at_or_above
-------+-------------
     1 |           5
     2 |           4
     3 |           2
     4 |           1
     5 |           1
(5 rows)
```

Exactly what we were looking for, but that's a lot of ugly hard-coding.  It may be fine if you have a smallish table and a tight range of scores as in this dataset.  But in our hypothetical example, the scores range from 1 to 100.  Are you seriously proposing to write this query with 100 select statements unioned all together?  It would take you at least 7 minutes to copy, paste, and adjust the numbers in each query and another 4 minutes to double check each line to make sure you didn't miss one of the hard-coded values.  In the meantime, to properly understand, write, and test the query I'm about to explain below, it would probably take at least several hours of deep concentration before you'd feel comfortable that you had the correct results.

But that query is just too ugly and hard-coding is wrong, wrong I say!  But feel free to just use the simple `sum case when` solution above, ignore the remainder of this post, and use those hours saved by <span style="text-decoration: line-through;">relaxing on the beach</span> adding more value to your employer.  I'll just check back in with you when you encounter this problem again, perhaps in a few years, when your scores range from 1 to 1000.

Ok, at this point you may already be thinking about window functions.  It feels like a window function should come into play here because for each score, we want to count the number of events at or above that score.  We should be able to do this by maintaining a window partition for each city and use that to count the number of events at or above each score.  As a first pass we might start out by aggregating on city and score to get the count of events, and then using a window function to sum up the number of events at or above each combination of city and score.


```sql
with n_events as
(
    select
        city,
        score,
        count(1) as n_events
    from
        events
    group by 1, 2
),
n_events_at_or_above_score as
(
    select
        city,
        score,
        sum(n_events) over (partition by city order by score desc range between unbounded preceding and current row) as n_events_at_or_above_score
    from
        n_events
)
select
    score,
    count(case when n_events_at_or_above_score > 0 then 1 else null end) as at_or_above
from
    n_events_at_or_above_score
group by 1
order by 1
;
 score | at_or_above
-------+-------------
     1 |           2
     2 |           3
     3 |           1
     5 |           1
(4 rows)
```

Unfortunately it's not right.  Where is the problem?  Let's look more closely at what happens after applying our window function:

```sql
with n_events as
(
    select
        city,
        score,
        count(1) as n_events
    from
        events
    group by 1, 2
),
n_events_at_or_above_score as
(
    select
        city,
        score,
        sum(n_events) over (partition by city order by score desc range between unbounded preceding and current row) as n_events_at_or_above_score
    from
        n_events
)
select * from n_events_at_or_above_score order by 1, 2
;
     city      | score | n_events_at_or_above_score
---------------+-------+----------------------------
 Chicago       |     1 |                          3
 Chicago       |     2 |                          2
 Chicago       |     3 |                          1
 Los Angeles   |     1 |                          2
 New York      |     2 |                          2
 San Francisco |     2 |                          1
 Seattle       |     5 |                          1
(7 rows)
```

Why do we only get 2 cities at or above a score of 1 when we know there are 5?  The answer is that there are gaps in our scores.  New York has two events with a score of 2, but none with a score of 1.  When we aggregate by both city and score, there are no rows to represent the combination of New York at score 1.  Thus, when we group by score to count the number of cities at or above that score with `count(case when n_events_at_or_above_score > 0 then 1 else null end)`{.sql}, the fact that New York has events at a score of 2 is not available for the combination of `city = 'New York'` and `score = 1`.

To fill in the gaps, we can go back to what we used earlier by constructing a template with all the rows we want to see in the output, selecting from that template and left joining to our grouped events.

Our template will need to have all combinations of city and score, that's the only way we'll be able to iterate over each combination and count the number of cities with events at or above each score.  To do this, we can use a cross join to build our template:

```sql
with template as (
    select
        e.city,
        s.score
    from
    (
        select generate_series(1, 5) as score
    ) s
    cross join
    (
        select city from events group by 1
    ) e
) select * from template order by 1, 2
;
     city      | score
---------------+-------
 Chicago       |     1
 Chicago       |     2
 Chicago       |     3
 Chicago       |     4
 Chicago       |     5
 Los Angeles   |     1
 Los Angeles   |     2
 Los Angeles   |     3
 Los Angeles   |     4
 Los Angeles   |     5
 New York      |     1
 New York      |     2
 New York      |     3
 New York      |     4
 New York      |     5
 San Francisco |     1
 San Francisco |     2
 San Francisco |     3
 San Francisco |     4
 San Francisco |     5
 Seattle       |     1
 Seattle       |     2
 Seattle       |     3
 Seattle       |     4
 Seattle       |     5
(25 rows)
```

Next, let's aggregate our events at the level of city and score. In our use case it doesn't matter if there are multiple events in the same city with the same score, but that's the lowest level of granularity we need and we don't want to duplicate rows in the output in case there are multiple events.


```sql
with event_scores as
(
    select
        city,
        score,
        count(1) as n_events
    from
        events
    group by 1, 2
) select * from event_scores order by 1, 2
;
     city      | score | n_events
---------------+-------+----------
 Chicago       |     1 |        1
 Chicago       |     2 |        1
 Chicago       |     3 |        1
 Los Angeles   |     1 |        2
 New York      |     2 |        2
 San Francisco |     2 |        1
 Seattle       |     5 |        1
(7 rows)
```

Now let's put the counts together with our template:

```sql
with template as (
    select
        e.city,
        s.score
    from
    (
        select generate_series(1, 5) as score
    ) s
    cross join
    (
        select city from events group by 1
    ) e
),
event_scores as
(
    select
        city,
        score,
        count(1) as n_events
    from
        events
    group by 1, 2
),
n_events as
(
    select
        t.city,
        t.score,
        coalesce(e.n_events, 0) as n_events
    from
        template t
    left join
        event_scores e
            on t.city = e.city
            and t.score = e.score
) select * from n_events order by 1, 2
;
     city      | score | n_events
---------------+-------+----------
 Chicago       |     1 |        1
 Chicago       |     2 |        1
 Chicago       |     3 |        1
 Chicago       |     4 |        0
 Chicago       |     5 |        0
 Los Angeles   |     1 |        2
 Los Angeles   |     2 |        0
 Los Angeles   |     3 |        0
 Los Angeles   |     4 |        0
 Los Angeles   |     5 |        0
 New York      |     1 |        0
 New York      |     2 |        2
 New York      |     3 |        0
 New York      |     4 |        0
 New York      |     5 |        0
 San Francisco |     1 |        0
 San Francisco |     2 |        1
 San Francisco |     3 |        0
 San Francisco |     4 |        0
 San Francisco |     5 |        0
 Seattle       |     1 |        0
 Seattle       |     2 |        0
 Seattle       |     3 |        0
 Seattle       |     4 |        0
 Seattle       |     5 |        1
(25 rows)
```

With the template providing all combinations of city and score, we can now setup our window function.  Looking at Chicago, what we'd want to see is 3 events at or above a score of 1, 2 events at or above 2, and 1 event at or above 3.  For Seattle, we'd want to see 1 event at or above each value of score from 1 to 5.  To accomplish this, we will partition by city and order by score in descending order.  Then, for each row, take the sum of n_events from the beginning of the partition (the highest value of score, 5) up to the `current row`.  This is a handy use of the `range` clause within the partition.  Most of the time what you'll see is `range between unbounded preceding and unbounded following`, which operates on all values of the partition for every row.  In our case, however, we don't want to sum up the values that are *less than* the current score, only those equal to or above it.

Here's what happens when we layer in our window function on top of the templatized count of events:

```sql
with template as (
    select
        e.city,
        s.score
    from
    (
        select generate_series(1, 5) as score
    ) s
    cross join
    (
        select city from events group by 1
    ) e
),
event_scores as
(
    select
        city,
        score,
        count(1) as n_events
    from
        events
    group by 1, 2
),
n_events as
(
    select
        t.city,
        t.score,
        coalesce(e.n_events, 0) as n_events
    from
        template t
    left join
        event_scores e
            on t.city = e.city
            and t.score = e.score
),
n_events_at_or_above_score as
(
    select
        city,
        score,
        n_events,
        sum(n_events) over (partition by city order by score desc range between unbounded preceding and current row) as n_events_at_or_above_score
    from
        n_events
) select * from n_events_at_or_above_score order by 1, 2
;
     city      | score | n_events | n_events_at_or_above_score
---------------+-------+----------+----------------------------
 Chicago       |     1 |        1 |                          3
 Chicago       |     2 |        1 |                          2
 Chicago       |     3 |        1 |                          1
 Chicago       |     4 |        0 |                          0
 Chicago       |     5 |        0 |                          0
 Los Angeles   |     1 |        2 |                          2
 Los Angeles   |     2 |        0 |                          0
 Los Angeles   |     3 |        0 |                          0
 Los Angeles   |     4 |        0 |                          0
 Los Angeles   |     5 |        0 |                          0
 New York      |     1 |        0 |                          2
 New York      |     2 |        2 |                          2
 New York      |     3 |        0 |                          0
 New York      |     4 |        0 |                          0
 New York      |     5 |        0 |                          0
 San Francisco |     1 |        0 |                          1
 San Francisco |     2 |        1 |                          1
 San Francisco |     3 |        0 |                          0
 San Francisco |     4 |        0 |                          0
 San Francisco |     5 |        0 |                          0
 Seattle       |     1 |        0 |                          1
 Seattle       |     2 |        0 |                          1
 Seattle       |     3 |        0 |                          1
 Seattle       |     4 |        0 |                          1
 Seattle       |     5 |        1 |                          1
(25 rows)
```

Now at last we're withing striking distance of our final result.  At this point what we want is to group by score, so that each group will consist of one row per city.  Then we count all the cities for which our calculated column `n_events_at_or_above_score` is greater than 0.


```sql
with template as (
    select
        e.city,
        s.score
    from
    (
        select generate_series(1, 5) as score
    ) s
    cross join
    (
        select city from events group by 1
    ) e
),
event_scores as
(
    select
        city,
        score,
        count(1) as n_events
    from
        events
    group by 1, 2
),
n_events as
(
    select
        t.city,
        t.score,
        coalesce(e.n_events, 0) as n_events
    from
        template t
    left join
        event_scores e
            on t.city = e.city
            and t.score = e.score
),
n_events_at_or_above_score as
(
    select
        city,
        score,
        sum(n_events) over (partition by city order by score desc range between unbounded preceding and current row) as n_events_at_or_above_score
    from
        n_events
)
select
    score,
    count(case when n_events_at_or_above_score > 0 then 1 else null end) as at_or_above
from
    n_events_at_or_above_score
group by 1
order by 1
;
 score | at_or_above
-------+-------------
     1 |           5
     2 |           4
     3 |           2
     4 |           1
     5 |           1
(5 rows)
```

So there's our non-hacky and scalable solution.  But recall that this was only the inner layer of the problem!  We still have to handle grouping by day.  And I promised 2 cross joins, so here we go.  I'm not going to provide a sample dataset for this because it will just be too big to work with so we'll have to use our imagination.  Imagine we have this dataset with thousands of events every day, each of which has a city and a severity score ranging from 1 to 100.

In our template what we now need to do is layer in the date.  We want to repeat each combination of city and score for each day as well.   So here is our double cross join template:

```sql
with template as (
    select
        d.day,
        e.city,
        s.score
    from
    (
        select date(generate_series(date '2019-01-01', date '2019-01-31', '1 day')) as day
    ) d
    cross join
    (
        select generate_series(1, 5) as score
    ) s
    cross join
    (
        select city from events group by 1
    ) e
) select * from template
;
    day     |     city      | score
------------+---------------+-------
 2019-01-01 | Chicago       |     1
 2019-01-02 | Chicago       |     1
 2019-01-03 | Chicago       |     1
 2019-01-04 | Chicago       |     1
 2019-01-05 | Chicago       |     1
 ...
 2019-01-27 | San Francisco |     5
 2019-01-28 | San Francisco |     5
 2019-01-29 | San Francisco |     5
 2019-01-30 | San Francisco |     5
 2019-01-31 | San Francisco |     5
(775 rows)
```

To layer day into the rest of the query is rather straightforward. The window function logic remains where it is, all we need to do is perpetuate day through each of the subsequent inline queries and then at the end we will group by both day and score like this:

```sql
select
    day,
    score,
    count(case when n_events_at_or_above_score > 0 then 1 else null end) as at_or_above
from
    n_events_at_or_above_score
group by 1, 2
order by 1, 2

```

Two cross joins and a window function, not bad for a little SQL problem solving.





[^1]: That is, if anyone were to write textbooks anymore.  This question is often used in interviews and appears on several interview practice sites.


