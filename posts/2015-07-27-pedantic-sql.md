---
layout: post
title: Pedantic SQL
date: 2015-07-27
topics: data
---

Pedantic SQL is a style guide and code beautifier for ANSI SQL intended to make `SELECT` statements more readable.  I use the term 'beautifier' loosely because one may well argue that no amount of formatting will be sufficient to make SQL look pretty.  I call it 'pedantic' because it is insistently rigid in how it is applied.  But this rigidity is what makes the resulting queries readable.  The lack of consistency in SQL writing styles makes it entirely too difficult to read others' queries.  A lot of bad practices have evolved which detract from query readability and extensibility.  A query should be understandable at a quick glance.  Following this style guide will make your queries a lot easier to grasp.  It will also make them a lot easier to extend or build upon later.


<!--excerpt-->

Pedantic SQL is a style guide and code beautifier for ANSI SQL intended to make `SELECT` statements more readable.  I use the term 'beautifier' loosely because one may well argue that no amount of formatting will be sufficient to make SQL look pretty.  I call it 'pedantic' because it is insistently rigid in how it is applied.  But this rigidity is what makes the resulting queries readable.  The lack of consistency in SQL writing styles makes it entirely too difficult to read others' queries.  A lot of bad practices have evolved which detract from query readability and extensibility.  A query should be understandable at a quick glance.  Following this style guide will make your queries a lot easier to grasp.  It will also make them a lot easier to extend or build upon later.

Nobody seems to care very much about how to format SQL code.  As a result, most SQL is absolutely godawful to look at.  Both analysts and programmers are guilty of this.  Many analysts who do not have experience writing code in other programming languages do not give much thought to how they format their code.  Programmers typically look at SQL queries as a chore, a distraction from their primary language, and thus they put only the tiniest amount of effort towards formatting their SQL.

This style guide is an attempt to change all that.  By following these rules, you will be able to write SQL queries that are neat, readable, and easy to share and modify.

### SQL query workflow recommendations

You should use a proper code editor with a monospaced font and syntax highlighting that recognizes the ANSI SQL standard.  The dialect is not particularly important, just choose one that covers the basics (keywords, literals, operators).

<span style="text-decoration:line-through;">Most</span> All GUI SQL clients suck.  They are not an acceptable substitute for a good text editor.  You will frequently be required to interact with shell or terminal clients since most database servers are on headless remote machines.  Avoid the practice of opening a shell client and typing in your query free-form.  SQL queries are not sentences.  When you submit a query in a shell, it is not easy to edit or run it again.  Compose your query in a text editor so you can save it locally and have a convenient means of editing.  Then copy and paste into your client.  Yes, this is a painful extra step, but is the only way to maintain control of your code.  Strongly consider using a version control system to backup your queries and share them with your org.


### Pedantic SQL style guide

Here are the rules of Pedantic SQL, in no particular order because they are all equally pedantic.

#### Do not capitalize keywords

This isn't COBOL.  Uppercase keywords take longer to type and look ugly.  If you are using them to differentiate between keywords and column names or table names, white space and proper indentation will do a much better job.

#### Do not use leading commas

Punctuation at the beginning of a line is atrocious.  This unfortunate habit is an attempt to solve for a truly annoying problem of SQL syntax errors:  missing commas.  SQL interpreters are dumb as stumps, they won't give you any hints about where a syntax error is, but 98.5% of the time the problem is a missing comma in a long list of statements in the `SELECT` clause.  In a mis-guided attempt to protect against this comic omission, some smart query writer decided one day to use leading commas and thereby forced the rest of us to endure this disgusting looking hack.  And it doesn't even solve the problem!  You still have to remember not to put the comma on the first line, so how is that any better than remembering not to put the comma on the last line??  Sentences don't begin with punctuation

,so please avoid this because it merely serves to make your query look awful.

#### Always use table aliases

This is a good practice even if you are only working with one table.  What happens later when you want to join to another table?  If you have aliased everything in your `SELECT`, `FROM`, and `WHERE` clauses, you'll have nothing to worry about.  Long complex queries with multiple tables usually begin as short simple queries on one table.  A habit of aliasing early will make it easier to build your simple queries into more complicated ones.

#### Use short relevant abbreviations as table aliases

Avoid using 'a' and 'b' unless you will only ever have two tables in your entire schema (and then only if the table names actually start with 'a' and 'b').  Here is a good list of table aliases:

* customers c (or cust)
* devices d (or dev)
* orders o
* order_items oi
* products p (or prod)
* users u
* impressions i (or impr)
* clicks c (or ck)
* global_weekly_sales_aggregates gwsa (or agg)

When you need to self-join (not ideal but sometimes necessary), append the alias with a 1 or 2 to distinguish which copy of the table you are operating on.  For pre/post analysis, try appending '_pre' and '_post' or just use 'pre' and 'post' to keep it simple.

#### Limit the use of one-liners

Unless your query is short and simple and will really fit on one line, where one line is something around 80 characters, you should use the more verbose line formatting and indentation rules below.  Again, the focus is on readability and extensibility.  You might start with something simple like:

```sql

-- acceptable one-liners
select count(1) from users where is_confirmed = 1
select * from products where sku = 'ABC-111222-333'

```

But as soon as you need to add more filter predicates or columns in your `SELECT` clause, your one-liner can quickly become ungainly:

```sql

-- bad
select count(1) from users where is_confirmed = 1 and signup_date between to_date('2014-01-01', 'yyyy-mm-dd') and to_date('2014-12-31', 'yyyy-mm-dd') and birthday = date(sysdate) and opt_in = 1 and email_preference_group like ('%marketing%')

-- worse!
select o.order_date, p.sku, sum(oi.price*oi.quantity) as gross_revenue, count(distinct oi.order_id) as order_count, sum(oi.quantity) as item_quantity from products p join order_items oi on oi.product_id = p.product_id join orders o on o.order_id = oi.order_id where p.product_category in ('books', 'movies') and o.order_date >= date(sysdate) - 7 group by o.order_date, p.sku

```

#### Begin each major keyword on a new line.  Indent with four spaces.

The Pedantic way to format a query uses newlines and indentation to put things in consistent locations relative to each other.  This makes it easy to see what is happening at a quick glance.

```sql

select
    u.name,
    u.birthday
from
    users u
where
    u.is_active = 1
    and u.birthday is not null

```

#### Joins

Use ANSI join syntax and format as follows:

```sql

select
    o.order_date,
    p.sku, 
    sum(oi.price*oi.quantity) as gross_revenue, 
    count(distinct oi.order_id) as order_count, 
    sum(oi.quantity) as item_quantity 
from 
    orders o 
join 
    order_items oi 
        on o.order_id = oi.order_id 
join 
    products p
        on oi.product_id = p.product_id 
where 
    o.order_date >= date(sysdate) - 7
    and p.product_category in ('books', 'movies') 
group by 
    o.order_date,
    p.sku

```

#### Joins to inline queries

When joining to an inline query, indent the query in the join clause to visually separate the inner query from the outer query.  The following pattern is useful to avoid joining two large fact tables together:

```sql

select
    i.impression_day,
    i.impressions,
    coalesce(ck.clicks, 0) as clicks,
    case
        when ck.clicks is null then 0
        else ck.clicks / i.impressions 
    end as ctr
from
(
    select
        i.impression_day,
        count(1) as impressions
    from
        impressions i
    where
        i.impression_day between '2015-06-01' and '2015-06-30'
        and i.impression_type = 'ad'
        and i.source = 'web'
    group by 1
) i
left join
(
    select
        ck.click_day,
        count(1) as clicks
    from
        clicks ck
    where
        ck.click_day between '2015-06-01' and '2015-06-30'
        and ck.impression_type = 'ad'
        and ck.source = 'web'
    group by 1
) ck
    on i.impression_day = ck.click_day

```

A common query pattern that arises is generating a frequency distribution.  Consider a table `devices` with a primary key of `device_id` and a foreign key `user_id` referencing the user associated with the device.  You want to generate the distribution of the number of devices per user.  The Pedantic way to write this query is:

```sql

select
    d.n_devices,
    count(d.user_id) as user_count
from
(
    select
        d.user_id,
        count(d.device_id) as n_devices
    from
        devices d
    group by 1
) d
group by 1
order by 1

```

#### Group by and order by

Use column references when available. Technically, this violates the ANSI SQL standard because the `GROUP BY` clause can be processed before the engine even begins to look at the `SELECT` clause, but it is a widely supported and useful feature.  Interpreters that do not support this feature are annoying, but also common.  It is tiresome and an unnecessary burden to be forced to type the entire contents of the `SELECT` statement again in the `GROUP BY` clause.  To add insult to injury, however, those Ellison-esque interpreters refuse to allow you to put aliases in the `GROUP BY` references, forcing a lot of extra editing and room for creating syntax errors.  Where your server allows them, using column references is highly convenient.

```sql

-- unfortunate
group by
    u.username,
    u.signup_date,
    d.device_id, 
    d.device_type, 
    d.device_name, 
    case 
        when u.confirmed_at is not null and u.opt_in = 1 then 1 
        else 0 
    end,
    t.transaction_day,
    t.transaction_type

-- a lot nicer, eh Larry?
group by 1, 2, 3, 4, 5, 6, 7, 8

```

#### Group by and having

The `HAVING` clause modifies a `GROUP BY`.  Here are some good ways to format:

```sql

group by 1, 2, 3
    having count(order_id) > 10

group by
    o.order_day,
    o.order_id,
    o.customer_id
having
    sum(oi.price*oi.quantity) > 100

```


#### Case statements

There are two ways of building a case expression.  

```sql

-- preferred
case
    when x = 1 then 'one'
    when x = 2 then 'two'
    else 'not one or two'
end

-- avoid
case x
    when 1 then 'one'
    when 2 then 'two'
    else 'not one or two'
end

```

There are two important reasons to avoid the second form of the case statement:  you are restricted to equality operations and you are restricted to evaluating the expression using only one column.  You may want to use the second method, but as soon as you need to do anything with other operators or columns, you will have to rewrite it, so just use the first method.  As an added bonus, the first method is more naturally readable.  It is almost poetic whereas the second method sounds stilted.

```sql

-- this method allows the use of other operators besides equality
case
    when x = 1 then 'one'
    when x = 2 then 'two'
    when x between 3 and 4 then 'three or four'
    when x in (5, 6, 9) then 'magic numbers'
    else 'something else'
end

-- and you can reference more than one column
case
    when x = 1 and y = 1 then 'both are 1'
    when x = 1 and y = 2 then 'hopefully you get the idea'
    else 'read the docs!'
end

```

#### Coalesce

There are all kinds of special functions that try to deal with null values:  `nvl`, `nvl2`, `nullif`, `ifnull`, `isnull`, `nullifzero`, `zeroifnull`, `decode`, `lnnvl`, `nanvl`, and probably some more that you should immediately forget about.  The only one that you need is `coalesce` and it is part of ANSI so portability is not an issue.  For anything that requires more complexity than what `coalesce` can provide, use a `case` statement.

```sql

select coalesce(x, 0) as no_nulls_here

-- equivalent:
case
    when x is null then 0
    else x
end

```

#### Special indentation for `OR`

Operator precedence rules are tricky and an easy source of logical errors.  The filter predicates in a `WHERE` clause are typically linked with `AND`, so when you need to use an `OR`, wrap it in a set of parentheses to make sure your logic is understood by the interpreter.  Additionally, provide some extra indentation and formatting to make the `OR` stand out visually.

```sql

where
    o.transaction_type = 'web'
    and ( o.order_status = 'pending' or o.order_source = 'phone' )

where
    u.username is not null
    and (
        ( d.device_type = 'android' and d.os_version like '4.4%' )
        or
        ( d.device_type = 'iphone' and d.os_version like '7.%' )
        or
        ( d.device_type = 'ipad' and d.os_version in ('7.2', '7.3') )
    )

```

In [PostgreSQL][p1], [MySQL][m1], [Vertica][v1], [Oracle][o1], and [SQL Server][s1], `AND` always has higher operator precedence than `OR`.  The nomenclature of levels of operator precedence is somewhat confusing.  What does it mean to have higher or lower precedence?  An operator with higher precedence is executed before an operator with lower precedence.  Operators at the same level of precedence are executed in sequence left to right.  To disambiguate the situation, think of a set of parentheses around the operator with higher precedence.

```sql

-- these two are equivalent
where
    A and B or C

where
    (A and B) or C

-- these two are also equivalent
where
    A or B and C

where
    A or (B and C)

```

In most queries, filter predicates are meant to be conjunctive, and are thus joined together with the `AND` operator.  Where this can lead to trouble is when you want to nest an `OR` condition within a long list of `AND` conditions:

```sql

where
    o.order_day = '2015-07-01'
    and p.product_category = 'books'
    and o.order_status = 'backorder' or s.ship_status = 'pending'

```

This query will probably not do what the author intended.  It will return all backordered books ordered on July 1 in addition to all orders with a ship status of pending.  What you probably want is the following, made explicit with the parentheses:

```sql

where
    o.order_day = '2015-07-01'
    and p.product_category = 'books'
    and ( o.order_status = 'backorder' or s.ship_status = 'pending' )

```

It is generally advisable when mixing conditional operators to use parentheses to make it clear both to the interpreter and to other human readers exactly what logic you are intending.

#### Dates

Date and time literals are a special class of hell for SQL query writers.  Your database may support date literals like this `'2015-07-01'` but will it perform date arithmetic using this form, or will it treat it sometimes like a date and other times like a string?


```sql

-- this may be treated as a date
select '2015-07-01'

-- but this probably won't work
select '2015-07-01' + 1

```

Be very careful with date literals, since the syntax between one platform and another can vary greatly.  Use one of these date functions appropriate to your platform for treating date literals as date column types.

```sql

-- to_date function, supported by PostgreSQL, Vertica, and Oracle
to_date('2015-07-01', 'yyyy-mm-dd')

-- str_to_date function, MySQL
str_to_date('2015-07-01', '%Y-%m-%d')

-- cast or convert, SQL Server
cast('2015-07-01' as datetime)
convert(datetime, '2015-07-01')

```

Here are links to the documentation for the `to_date()` function in [PostgreSQL][p3], [Vertica][v3], and [Oracle][o3], the `str_to_date()` function in [MySQL][m3], and `cast()` and `convert()` in [SQL Server][s3].

Read more here about date literals and date/time conversion functions in [PostgreSQL][p2], [MySQL][m2], [Vertica][v2], [Oracle][o2], and [SQL Server][s2].

#### When joining, use `ON` instead of `USING` 

`USING` only works if the join columns are named the same in both tables and, for some bizarre reason, you can't reference these columns in your `SELECT` clause.  Why?  Who cares, just use `ON` to specify your join conditions.

#### Only use ANSI join syntax

The ANSI join syntax allows you to cleanly separate join conditions from filter predicates.  When using old-style joins (comma-separated lists of tables in the `FROM` clause), this essentially overloads the `WHERE` clause with join conditions and this makes it easy to inadvertently miss a crucial join condition.

```sql

-- ruh-roh!
select
    oi.product_id,
    sum(oi.item_quantity) as total_items
from
    orders o, order_items oi, products p
where
    o.order_day = '2015-06-30'
    and oi.product_id = p.product_id
    and o.order_status = 'complete'
    and oi.item_quantity > 0
    and oi.price > 0
    and p.product_category = 'books'
    and p.status = 'out-of-stock'
group by 1
order by 2 desc

```

You've just done a cross join between your orders and order_items tables which will massively inflate the resulting sum.  Instead, if you use ANSI join syntax, it is a lot more difficult to lose your join conditions in a long list of filter predicates:

```sql

-- much better!
select
    oi.product_id,
    sum(oi.item_quantity) as total_items
from
    orders o
join
    order_items oi
        on o.order_id = oi.order_id
join
    products p
        on oi.product_id = p.product_id
where
    o.order_day = '2015-06-30'
    and o.order_status = 'complete'
    and oi.item_quantity > 0
    and oi.price > 0
    and p.product_category = 'books'
    and p.status = 'out-of-stock'
group by 1
order by 2 desc

```

#### Avoid putting join conditions in the where clause

The previous example makes a case for using ANSI join syntax as a way of avoiding mistaken omissions of join conditions.  But this only works if you are vigilant about keeping join conditions in the `JOIN` clause and filter predicates in the `WHERE` clause.  It's easy to be lax about this because you can actually put *all* your filters in the `ON` clause of a join, even if they have nothing to do with joining the two tables!  That's because the optimizer doesn't know or care about the difference between a join condition and a filter predicate, they are simply logical rules used to limit the result set from the initial Cartesian product of the tables.  Likewise, you can just as easily put join conditions in the `WHERE` clause.  But that's not the Pedantic way.  Clean separation of join conditions from filter predicates is more of a convenience to you, the query writer, than it is to the SQL engine.  

But if these are only conveniences, why bother?  Well, there are more than just aesthetic factors involved in this rule.  Consider this query where we want to count the number of impressions and clicks on each ad for each user:

```sql

select
    i.ad_id,
    i.user_id,
    count(i.user_id) as impressions,
    count(ck.user_id) as clicks
from
    impressions i
join
    clicks ck
        on i.impression_day = ck.click_day
        and i.user_id = ck.user_id
where
    i.impression_day between '2015-06-01' and '2015-06-30'
    and i.ad_source = ck.ad_source
group by 1, 2
order by 1, 3 desc

```

After running this we realize that it will only return impressions if the user has clicked at least once.  Since the query is using an inner join, it will only return records in both tables.  So, what we really want to do is change this to a left join:

```sql

-- danger will robinson!
select
    i.ad_id,
    i.user_id,
    count(i.user_id) as impressions,
    count(ck.user_id) as clicks
from
    impressions i
left join
    clicks ck
        on i.impression_day = ck.click_day
        and i.user_id = ck.user_id
where
    i.impression_day between '2015-06-01' and '2015-06-30'
    and i.ad_source = ck.ad_source
group by 1, 2
order by 1, 3 desc

```

These queries will return identical results.  Why?  Because the `WHERE` clause contains what should really be a join condition.  Your intent to make this a left join is subverted by the presence of the line `and i.ad_source = ck.ad_source`.

```sql

-- all better now
select
    i.ad_id,
    i.user_id,
    count(i.user_id) as impressions,
    count(ck.user_id) as clicks
from
    impressions i
left join
    clicks ck
        on i.impression_day = ck.click_day
        and i.user_id = ck.user_id
        and i.ad_source = ck.ad_source
where
    i.impression_day between '2015-06-01' and '2015-06-30'
group by 1, 2
order by 1, 3 desc

```

When performing an outer join, ensure that there are no references to the optional table in the `WHERE` clause, or you will instead be doing an inner join.

#### Avoid putting filter predicates in the join clause

As a corollary, you don't want to overload your `JOIN` clause with what are effectively filter predicates that belong in the `WHERE` clause.  Maintaining a clean distinction between these two concepts helps ensure that unintended side effects don't crop up when making changes to the join type.  It also aids readability because you know that when you are looking at the join conditions, you are looking at only the information that is necessary to join the tables together, while the `WHERE` clause contains the filters that reduce your result set to only the records you are interested in retrieving.

#### Avoid Oracle-style outer join syntax

Oracle introduced the `(+)` operator to signify an optional (null-able) column many years before the ANSI outer join syntax was standardized.  For several years after that, Oracle's optimizer was far more efficient performing outer joins using the old-style syntax.  However, current versions of Oracle fully support the ANSI syntax without any performance penalties.  Oracle now [recommends using the ANSI syntax](http://docs.oracle.com/cd/B28359_01/server.111/b28286/queries006.htm) because there are several important deficiencies in the Oracle syntax that are solved by using the ANSI syntax.  SQL Server had a similar outer join operator `*=` but it never worked correctly anyway.  Definitely stay away from that one!

#### Avoid count(*)

When you do a `count(*)`, you are instructing the database to examine every column in the result set looking for a non-null value.  In addition to being sub-optimal, this may also lead to inaccurate results in cases where you have nulls where you aren't expecting them.  In most cases, you do not need to examine the entire record, you are only interested in counting non-null values on one column, typically a primary key.  Where you want to count all records in the result set, regardless of whether some or all columns are null, use `count(1)`.  With the first method, the optimizer needs to evaluate only one column, and using the second method, it doesn't even need to do that, it simply returns a count for each record in the result set.

```sql

select
    count(user_id)

select
    count(1)

```

#### Cross joins

Most of the time, cross joins (aka Cartesian joins), are not desirable.  However, there are valid cases in which you really do want this type of join.  The syntax for this is `CROSS JOIN` without an `ON` condition.  Consider the following scenario in which you have a fact table with a user registration date and you would like to generate a report showing the cumulative counts of registered users by week.  Build a dimension table called `weeks` where each row contains a week_starting and week_ending day.  When you do a cross join between the user registration table and the weeks table, the intermediate result set will repeat your user registration table for each week.  This makes it easy to generate the desired report of cumulative user registrations.

```sql

-- cumulative counts of registered users by week
select
    u.first_day_of_week,
    count(distinct case when u.reg_day <= w.last_day then 1 else null end) as users
from
(
    select
        w.first_day_of_week,
        w.last_day_of_week as last_day,
        u.user_id,
        u.registration_day as reg_day
    from
        users u
    cross join
        weeks w
    where
        weeks.first_day_of_week between '2014-12-29' and '2015-12-28'
) u
group by 1
order by 1

```

#### Strongly prefer left join to right join

It is more natural to think of outer joins as occurring between a required table on the left and an optional table on the right.  This is an arbitrary choice, but one where consistency will greatly aid query readability and ease of interpretation.  It's possible to write the same query using either method, but the apparent simplicity of altering a single keyword from `LEFT` to `RIGHT` actually causes a huge disconnect in our brains.  If you are used to conceptualizing left joins, it takes a lot of mental headache to rewire your brain to look at it from the opposite direction.

```sql

-- this is natural
from
    products p
left join
    categories c
        on p.category_id = c.category_id

-- this is migraine-inducing
from
    categories c
right join
    products p
        on p.category_id = c.category_id

```

In my SQL code repository, I currently count 1,523 occurrences of "left join" and 16 occurrences of "right join".  The only reasons I have used "right join" were to maintain consistency in queries inherited from another analyst, and a literal translation of a pig script where I again wanted to maintain consistency with the original script.  For most purposes, you should stick to left join because being consistent will make it easier to wrap your head around what is happening.

#### Omit the "outer" when doing a left join

It's redundant.  When you say `LEFT JOIN`, that is by definition an outer join.  There's no other type of left join and no reason to type the extra word.  The only time you should use the `OUTER` keyword is with a `FULL OUTER JOIN`.  These are relatively rare and it's worth the extra effort to make explicit what you intend.

```sql

-- all the joins
join
left join
right join
full outer join
cross join

```

#### Likewise omit "inner" from inner joins

See above.  Without any qualifier, a `JOIN` will be an inner join (aka an equi-join).

#### Be careful with "distinct".

The `DISTINCT` keyword is often misunderstood and misplaced.  What appears natural in human language is not necessarily how the interpreter will interpret your use of `DISTINCT`.

```sql

select
    distinct a, b, c

-- what you probably should do instead:
select
    a, b, c
...
group by 
    a, b, c

```


#### Don't use `union`.  You meant to use `union all`.  Seriously.

The `UNION` construct is a rarity compared to `UNION ALL`.  If you are using `UNION` by itself, your query probably needs a re-write.  If you do not understand the difference, be sure to do some reading and save yourself angst when staring at unexpected query output.

#### Comments

Comments can cause problems with many interpreters.  In production code, you may need to strip them out entirely.  When organizing a large SQL script, begin the file with a comment block demarcated with `/*` and `*/`.  A good, descriptive comment block should include the filename, title, date, summary of the script, and any other notes that may help you or others understand the purpose of the analysis.

Keep inline comments to a minimum. Use `--` to indicate a quick single-line comment, or to comment out a line which indicates an optional variant of your query.  A well formatted query can be understood without the need for comments.

```sql

/***
    pedantic_sql_examples.sql
    27 Jul 2015 - czep
    
    Sample queries to illustrate the basic concepts of Pedantic SQL.
***/

-- example 1:
select
    ...

```



[p1]: http://www.postgresql.org/docs/9.5/static/sql-syntax-lexical.html#SQL-PRECEDENCE-TABLE
[m1]: http://dev.mysql.com/doc/refman/5.5/en/operator-precedence.html
[v1]: http://my.vertica.com/docs/7.1.x/HTML/index.htm#Authoring/SQLReferenceManual/LanguageElements/Expressions/Expressions.htm%3FTocPath%3DSQL%2520Reference%2520Manual|SQL%2520Language%2520Elements|Expressions|_____0
[o1]: http://docs.oracle.com/database/121/SQLRF/conditions001.htm#i1034834
[s1]: https://msdn.microsoft.com/en-us/library/ms190276.aspx


[p2]: http://www.postgresql.org/docs/9.5/static/functions-datetime.html
[m2]: http://dev.mysql.com/doc/refman/5.5/en/date-and-time-functions.html
[v2]: http://my.vertica.com/docs/7.1.x/HTML/index.htm#Authoring/SQLReferenceManual/Functions/Date-Time/DateTimeFunctions-1.htm%3FTocPath%3DSQL%2520Reference%2520Manual%7CSQL%2520Functions%7CDate%252FTime%2520Functions%7C_____0
[o2]: http://docs.oracle.com/database/121/SQLRF/functions002.htm#i88891
[s2]: https://msdn.microsoft.com/en-us/library/ms186724.aspx


[p3]: http://www.postgresql.org/docs/9.5/static/functions-formatting.html
[m3]: http://dev.mysql.com/doc/refman/5.5/en/date-and-time-functions.html#function_str-to-date
[v3]: http://my.vertica.com/docs/7.1.x/HTML/index.htm#Authoring/SQLReferenceManual/Functions/Formatting/TO_DATE.htm%3FTocPath%3DSQL%2520Reference%2520Manual|SQL%2520Functions|Formatting%2520Functions|_____3
[o3]: http://docs.oracle.com/database/121/SQLRF/functions218.htm#i1003589
[s3]: https://msdn.microsoft.com/en-us/library/ms187928.aspx





