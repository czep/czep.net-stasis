---
layout: post
title: Generating post-hoc session ids in SQL
date: 2016-10-16
topics: data
---

This is a short demonstration of the power of analytic functions in SQL to generate session ids for raw event data.

<!--excerpt-->

This is a short demonstration of the power of analytic functions in SQL to generate session ids for raw event data.

If you need to analyze data from user-generated events, then at some point you will have to deal with the concept of sessions.  The most obvious use case in which sessions come up is in web analytics, where webserver request logs---or some derived reporting mechanism ultimately driven by server request logs---capture timestamped events as they occur along with relevant information such as ip address, user agent, request url, and any other server context that would be interesting or required for reporting purposes.  The same also applies to streaming, client-side logging packages which gather context about a page render event and dispatch a web request to a logging server.  

Typically, you would also want to have a unique user identifier to distinguish the origin of one set of events from another.  This is commonly accomplished by generating a unique id for each visitor to your site and storing that value in a cookie.  When the user---or more precisely, the browser---visits the site again, the data stored in the cookie provides a way of linking events over time and attributing them, in a loose way, to an individual user.  This gets complicated very quickly, and for various reasons---inconsistencies in browser handling of cookies, security, paranoia, the asynchronous nature of the web---makes accurate user tracking an approximate art rather than an exact science.

However, it is not always possible to assign a session id to the events as they are being generated.  It is expensive to maintain client session state on the server side.  If you don't have a server-side mechanism for management of user sessions, then this session id must be generated post-hoc in a transformation process.

The logic for defining sessions can vary across use cases.  There are two time considerations we have to answer.  First, does a session end after N minutes of *inactivity*, or does it end exactly N minutes after the session began?  Secondly, can sessions span date boundaries or are they reset at midnight?  If sessions can span day boundaries then they will not be additive across days.  You could also wind up with sessions that never end.  Of course, we also have to decide what value for N we want.

We will loosely approximate Google Analytics here by defining session boundaries as 30 minutes of inactivity and automatically reset all sessions at each day boundary.

Here is a complete example query that demonstrates the technique described in this post.  

```sql

with raw_events as (
    select 111 as user_id, timestamp '2016-05-01 17:00:00' as event_time union all
    select 111 as user_id, timestamp '2016-05-01 17:01:00' as event_time union all
    select 111 as user_id, timestamp '2016-05-01 17:02:00' as event_time union all
    select 111 as user_id, timestamp '2016-05-01 17:03:00' as event_time union all
    select 222 as user_id, timestamp '2016-05-01 18:00:00' as event_time union all
    select 333 as user_id, timestamp '2016-05-01 19:00:00' as event_time union all
    select 333 as user_id, timestamp '2016-05-01 19:10:00' as event_time union all
    select 333 as user_id, timestamp '2016-05-01 19:20:00' as event_time union all
    select 333 as user_id, timestamp '2016-05-01 19:30:00' as event_time union all
    select 333 as user_id, timestamp '2016-05-01 20:01:00' as event_time union all
    select 333 as user_id, timestamp '2016-05-01 20:02:00' as event_time union all
    select 444 as user_id, timestamp '2016-05-01 23:01:00' as event_time union all
    select 444 as user_id, timestamp '2016-05-01 23:21:00' as event_time union all
    select 444 as user_id, timestamp '2016-05-01 23:59:00' as event_time union all
    select 444 as user_id, timestamp '2016-05-02 00:01:00' as event_time union all
    select 444 as user_id, timestamp '2016-05-02 00:21:00' as event_time union all
    select 444 as user_id, timestamp '2016-05-02 23:59:00' as event_time union all
    select 444 as user_id, timestamp '2016-05-03 00:05:00' as event_time
),
lagged_events as (
    select
        user_id,
        event_time,
        lag(event_time) over (partition by date(event_time), user_id order by event_time) as prev
    from
        raw_events
),
new_sessions as (
    select
        user_id,
        event_time,
        case
            when prev is null then 1
            when event_time - prev > interval '30 minutes' then 1
            else 0
        end as is_new_session
    from
        lagged_events
),
session_index as (
    select
        user_id,
        event_time,
        is_new_session,
        sum(is_new_session) over (partition by user_id order by event_time rows between unbounded preceding and current row) as session_index
    from
        new_sessions
)
select
    cast(user_id as varchar) || '.' || cast(session_index as varchar) as session_id,
    user_id,
    event_time,
    is_new_session,
    session_index
from
    session_index
order by 
    user_id, event_time

```

It may look daunting when you look at it first glance, but there are really only three important layers to unpack.  Most importantly, there are no joins---everything is accomplished with analytic functions.  Let's walk through the query starting at the deepest layer of nesting, which when using `with` statements appears as our first named sub-query called `raw_events`.  We've created a dummy dataset consisting of two columns, a numeric `user_id` and a timestamp called `event_time`.  Feel free to try this out on your own dataset, the point of this canned dataset is that it will run in the interpreter without needing to access any of your physical tables and it illustrates a few of the design criteria of our sessionizing scheme.  We have 4 users and if you look closely, there should be a total of 9 sessions.

* User 111 has 4 events each one minute apart all on the same day.  This is 1 session.
* User 222 has 1 event.  This is 1 session.
* User 333 has 6 events.  The first four occur over 40 minutes but each event occurs 10 minutes after the previous event, so these should all be treated as 1 session.  Then, there are 2 more events that occur 31 and 32 minutes, respectively, after the previous session, so these two events should be treated as a new session for this user.
* User 444 has 7 events, spanning two day boundaries, and if you examine the event times, you should see we should end up with 4 sessions (the first two events make up the first session, the next one is in a session by itself, then a day boundary occurs and a third session should include the next 2 events, then an event just before midnight which will be a fourth session, and finally another day boundary marking session 5).

This example will allow us to test that our session logic works in the following way:
* sessions shall only consist of one user
* sessions expire with 30 minutes of inactivity
* a day boundary creates a new session

To start with, here is what our raw data is looking like, sorted by user_id and timestamp:

     user_id |     event_time      
    ---------+---------------------
         111 | 2016-05-01 17:00:00
         111 | 2016-05-01 17:01:00
         111 | 2016-05-01 17:02:00
         111 | 2016-05-01 17:03:00
         222 | 2016-05-01 18:00:00
         333 | 2016-05-01 19:00:00
         333 | 2016-05-01 19:10:00
         333 | 2016-05-01 19:20:00
         333 | 2016-05-01 19:30:00
         333 | 2016-05-01 20:01:00
         333 | 2016-05-01 20:02:00
         444 | 2016-05-01 23:01:00
         444 | 2016-05-01 23:21:00
         444 | 2016-05-01 23:59:00
         444 | 2016-05-02 00:01:00
         444 | 2016-05-02 00:21:00
         444 | 2016-05-02 23:59:00
         444 | 2016-05-03 00:05:00

We're going to make use of the `lag` analytic function.  The standard SQL data model operates in terms of sets, and as such there is no inherent ordering of the rows in a table from the query optimizer's perspective.  Analytic functions, also known as window functions, let you define 'partitions' of your result set for which you can then specify a sort order.  This means you can then operate on ordered result sets where the concept of 'next row' and 'previous row' have a legitimate meaning.

In our `lagged_events` sub-query, we create a partition with two specifiers:  `date(event_time)` and `user_id`.  This means that for each row, our `lag` function will operate on a window that consists of all events occurring on the same day and with the same user id.  Next we specify that the window is to be ordered by the event time in default ascending order.  The `lag` function returns the value of the previous row in the partition according to the ordering.  In this way, we can assume that the value returned by lag refers to the most recent event time for that user on that day.  When the window boundary is reached, i.e. the first event for a given user on a given day, the lag function will return a null value.

Now, in our `new_sessions` sub-query, we can build in the logic for determining whether a given record represents the start of a new session.  We do this with a `case` statement which first looks at the value for `prev` returned by our lag function in the previous sub-query, which if null means we have a new session since this would be the first event by that user on that day.  Next, the case statement compares the current event time with the previous event time for that user, and if more than 30 minutes has elapsed we again signal that a new session has begun.

At this point we now have a new column, `is_new_session`, for each row having a value of 1 to indicate that the row is a new session and 0 otherwise.  Now we wish to use this to generate a 'session index'---a number starting at 1 and incrementing each time a new session is found for a given user.  We accomplish this in the `session_index` sub-query using another analytic function, `sum`.  Sum, of course, is also an aggregate function when applied to data that has been grouped, but in this context, as we define a partition, we are using the analytic variant of sum.  Here we specify a partition by user id and we order the window by event time.  Note that we do not need to include day in the partition because we've already created new sessions on day boundaries for each user.  Here we introduce a range clause, `rows between unbounded preceding and current row`.  This means the sum function will operate on a window bounded below by the start of the partition (in this case the first event for the user id), and bounded above by the current row.  This way, the sum function won't simply return the total number of sessions observed for that user across the entire result set.  Instead, each row will represent the number of sessions thus far seen for that user.  

In the final piece of the query, we merely create a session id by concatenating the user id with the session index.  Here are the results you should expect to see.  You can verify that this matches the logic we were aiming for.


     session_id | user_id |     event_time      | is_new_session | session_index 
    ------------+---------+---------------------+----------------+---------------
     111.1      |     111 | 2016-05-01 17:00:00 |              1 |             1
     111.1      |     111 | 2016-05-01 17:01:00 |              0 |             1
     111.1      |     111 | 2016-05-01 17:02:00 |              0 |             1
     111.1      |     111 | 2016-05-01 17:03:00 |              0 |             1
     222.1      |     222 | 2016-05-01 18:00:00 |              1 |             1
     333.1      |     333 | 2016-05-01 19:00:00 |              1 |             1
     333.1      |     333 | 2016-05-01 19:10:00 |              0 |             1
     333.1      |     333 | 2016-05-01 19:20:00 |              0 |             1
     333.1      |     333 | 2016-05-01 19:30:00 |              0 |             1
     333.2      |     333 | 2016-05-01 20:01:00 |              1 |             2
     333.2      |     333 | 2016-05-01 20:02:00 |              0 |             2
     444.1      |     444 | 2016-05-01 23:01:00 |              1 |             1
     444.1      |     444 | 2016-05-01 23:21:00 |              0 |             1
     444.2      |     444 | 2016-05-01 23:59:00 |              1 |             2
     444.3      |     444 | 2016-05-02 00:01:00 |              1 |             3
     444.3      |     444 | 2016-05-02 00:21:00 |              0 |             3
     444.4      |     444 | 2016-05-02 23:59:00 |              1 |             4
     444.5      |     444 | 2016-05-03 00:05:00 |              1 |             5
    (18 rows)


Here's an alternative version of the full query, using nested sub-queries instead of `with` statements.  Personally I find the first version more readable, but note that using `with` statements means that all your sub-queries are retained in the top-level namespace so you need to be more careful with aliasing.

```sql

select
  cast(user_id as varchar) || '.' || cast(session_index as varchar) as session_id,
  user_id,
  event_time,
  is_new_session,
  session_index
from
(
  select
    user_id,
    event_time,
    is_new_session,
    sum(is_new_session) over (partition by user_id order by event_time rows between unbounded preceding and current row) as session_index
  from
  (
    select
      user_id,
      event_time,
      case
        when prev is null then 1
        when event_time - prev > interval '30 minutes' then 1
        else 0
      end as is_new_session
    from
    (
      select
        user_id,
        event_time,
        lag(event_time) over (partition by date(event_time), user_id order by event_time) as prev
      from
      (
        select 111 as user_id, timestamp '2016-05-01 17:00:00' as event_time union all
        select 111 as user_id, timestamp '2016-05-01 17:01:00' as event_time union all
        select 111 as user_id, timestamp '2016-05-01 17:02:00' as event_time union all
        select 111 as user_id, timestamp '2016-05-01 17:03:00' as event_time union all
        select 222 as user_id, timestamp '2016-05-01 18:00:00' as event_time union all
        select 333 as user_id, timestamp '2016-05-01 19:00:00' as event_time union all
        select 333 as user_id, timestamp '2016-05-01 19:10:00' as event_time union all
        select 333 as user_id, timestamp '2016-05-01 19:20:00' as event_time union all
        select 333 as user_id, timestamp '2016-05-01 19:30:00' as event_time union all
        select 333 as user_id, timestamp '2016-05-01 20:01:00' as event_time union all
        select 333 as user_id, timestamp '2016-05-01 20:02:00' as event_time union all
        select 444 as user_id, timestamp '2016-05-01 23:01:00' as event_time union all
        select 444 as user_id, timestamp '2016-05-01 23:21:00' as event_time union all
        select 444 as user_id, timestamp '2016-05-01 23:59:00' as event_time union all
        select 444 as user_id, timestamp '2016-05-02 00:01:00' as event_time union all
        select 444 as user_id, timestamp '2016-05-02 00:21:00' as event_time union all
        select 444 as user_id, timestamp '2016-05-02 23:59:00' as event_time union all
        select 444 as user_id, timestamp '2016-05-03 00:05:00' as event_time
      ) f
    ) f
  ) f
) f
order by user_id, event_time

```


