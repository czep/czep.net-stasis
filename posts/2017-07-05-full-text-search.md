---
layout: post
title: Full text search with Postgres and Django
date: 2017-07-05
topics: web
---

Being one of the most fundamental problems in computer science, occupying the first half of Volume 3 of Donald Knuth's classic work [The Art of Computer Programming](http://www-cs-faculty.stanford.edu/~uno/taocp.html), it would seem fair to assume that by 2017 search would be mainly a done deal.  But search is still hard.  General purpose algorithms may perform decently in the average case, but what constitutes decent performance may not scale well enough to meet user demands.  Unless you're building a search engine, you are probably not designing your data structures specifically to take advantage of search algorithms.  When web application developers work on adding a search feature, they are not going to start evaluating different algorithms with Big-O notation.  And they're not going to ask whether quicksort or merge sort would obtain the best performance on their specific dataset.  Instead, most likely, they will defer to whatever features are available in their chosen database and application framework, and simply go from there.

That search is hard is why so many sites either defer to whatever vanilla features are available in their framework or outsource to a third-party library such as the Lucene-based document retrieval system [Elasticsearch](https://en.wikipedia.org/wiki/Elasticsearch), or to a search-as-a-service provider like [Algolia](https://www.algolia.com/).  While the cost in terms of both time and money of integrating third party libraries or services can be prohibitive for a small development team, the negative impacts of providing a poor search interface cannot be understated.  In this post I will walk through the process of building decent search functionality for a small to medium sized website using Django and Postgres.

<!--excerpt-->

Search.  The most successful company in the history of the internet made its name by solving search and yet today most websites still get it horribly wrong.  Search is one of the most critical features of content heavy websites and user expectations for both performance and relevance are highly demanding.  Users unforgivingly expect your website to allow them to search quickly and return the most relevant results.  If either of these criteria are unmet, your visitors will quickly denounce your search as useless and either find another way to locate their content---falling back to a google site search if you're lucky---or finding another website altogether if you're not.  

### Search is hard

Being one of the most fundamental problems in computer science, occupying the first half of Volume 3 of Donald Knuth's classic work [The Art of Computer Programming](http://www-cs-faculty.stanford.edu/~uno/taocp.html), it would seem fair to assume that by 2017 search would be mainly a done deal.  But search is still hard.  General purpose algorithms may perform decently in the average case, but what constitutes decent performance may not scale well enough to meet user demands.  Unless you're building a search engine, you are probably not designing your data structures specifically to take advantage of search algorithms.  When web application developers work on adding a search feature, they are not going to start evaluating different algorithms with Big-O notation.  And they're not going to ask whether quicksort or merge sort would obtain the best performance on their specific dataset.  Instead, most likely, they will defer to whatever features are available in their chosen database and application framework, and simply go from there.

That search is hard is why so many sites either defer to whatever vanilla features are available in their framework or outsource to a third-party library such as the Lucene-based document retrieval system [Elasticsearch](https://en.wikipedia.org/wiki/Elasticsearch), or to a search-as-a-service provider like [Algolia](https://www.algolia.com/).  While the cost in terms of both time and money of integrating third party libraries or services can be prohibitive for a small development team, the negative impacts of providing a poor search interface cannot be understated.  In this post I will walk through the process of building decent search functionality for a small to medium sized website using Django and Postgres.


### The first step: LIKE queries

When first getting started with search, you may be inclined to start with queries that use the ANSI SQL standard ['LIKE' expression](https://www.postgresql.org/docs/current/static/functions-matching.html).  However, despite the fact that the LIKE operator is usually very efficiently performed by SQL optimizers, using LIKE to execute search queries will only lead you to heartache and pain.  There are multiple problems with this approach:

1. **Indexes**.  If the '%' wildcard is used at the beginning of your search term, the query cannot take advantage of indexes.
2. **Case sensitivity**.  LIKE will only trigger a match if the case also matches.  A search for 'san' will not match 'San'.
3. **Word boundaries**.  LIKE cannot distinguish between partial matches within words compared to whole words.  A search for '%alam%' will match 'salami' as well as 'alamo'.
4. **Relevance and ranking**.  Whether a search term appears once or a thousand times, the result of the LIKE expression will simply be "true" in both cases.  There's no way to score search results based on relevance.
5. **Single column**.  LIKE can only operate on one column at a time.  If your search target involves multiple columns (text + description, name + city, etc.), then you have to perform the same search function twice for each row.
6. **Linguistic stemming**.  Document retrieval systems pre-process tokens by applying stemming rules.  This is how a search for 'satisfies' can also match 'satisfy'.  The implications of this are profound, it makes search far more natural. Many words have dozens of variations that all stem to the same root.  This would be impossible to replicate with keyword search using LIKE or regular expressions.  

Some of these issues can be addressed individually to varying degrees but not without drawbacks.  You can force the use of an index by anchoring your search at the beginning of the string, eg. `'alam%'`.  However, this will seriously limit the utility of your search as users will not be able to find words appearing at arbitrary locations.  When searching something with a lot of text like a blog post, this would be practically useless.  For case insensitive matching, the `ILIKE` keyword can be substituted for `LIKE`.  However, this is a more expensive operation, and not being SQL standard, it may not be available in your database.  The optimizer needs to convert both the search term and the search target to a common case before performing the search, so you'd be adding expensive string functions on every row.

To get around the word boundary issue, you may turn to regular expressions.  In Postgres, the `~` and `~*` operators let you write queries using POSIX-style regular expressions.  So, to match 'alamo' but not 'salami', instead of `LIKE '%alam%'`, you could write `~* '\malam.*'`.  However, implementing search queries with regular expressions is a dangerous route---not only are regexes notoriously difficult to get right and can suffer from egregiously poor performance, conceptually they do not translate very well from the types of natural language queries most users expect to use in their searches.  In order to employ the flexibility to construct relevant search queries that meet the needs of users, we will need to approach the problem using a completely different algorithmic approach.

### Full Text search

Postgres added full text search with the introduction of the `tsvector`, `tsquery`, and `match` operators in version 8.3.  Being rooted in the same vector space model representation of documents used in information retrieval systems like Lucene, Postgres' full text search not only opens up the possibility of flexible, modern, natural language search, it can also be very performant if you pay some attention to the column types and function calls used in your searches.

The prescriptions I offer here are primarily relevant in cases of medium-sized, mostly static data.  By medium-sized, I'm thinking on the order of hundreds of thousands of rows.  When you get to hundreds of millions of rows, you will most likely want to take search out of your database and into a caching layer or dedicated search framework.  In addition, if your data is highly dynamic, then some of these approaches may not scale as well as they will with mostly static data.  I have not investigated the performance impact of index rebuilds or triggers that may be necessary to keep the search indexes up to date with rapidly changing data.

### Use case

The inspiration for my interest in full-text search came from a project to visualize data on [California public schools](http://www.cde.ca.gov/ds/dd/) provided by the California Department of Education.  With over 17,000 schools in the database, search will be an integral feature to allow users to quickly navigate to the school they're interested in.

Here is a basic summary of the model class in Django for our schools table:

```python
class Schools(models.Model):
    school = models.CharField(max_length=128)
    city = models.CharField(max_length=32)
    county = models.CharField(max_length=32)
    zipcode = models.CharField(max_length=10)
```

As I was getting started with this project, it occurred to me that search would need to be an integral feature of the UI.

> "Hey, let's add a search box!  With ajax and autocomplete!"

I had this thought several weeks ago, and thus began the odyssey which has culminated in this post.  As usual when developing what may become a complex system, it's wise to begin with the simplest, most naive case, examine its performance, and iterate only when and where it makes sense to improve either from a functional or a performance standpoint.  There is one situation, however, where optimization is most certainly not premature: adding indexes for the search queries to use.

### The Importance of Indexing

DO NOT let search queries perform sequential scans of your database!

Don't argue with me about this one.  Take a look at the query plan for your searches.  If they require a sequential scan over your database tables, you will want to fix that immediately.  Your search is not going to perform well enough to meet user expectations, unless you have so little content that there's no point in even adding a search feature because everything would fit on a single page anyway.  We already have an index created for the primary key of our table, but the primary key is not the name of the school.  It's highly unlikely that you will want to be searching on primary keys, so you'll need to manually create an index for the columns containing the content that will be accessible to your search functions.

```sql
CREATE INDEX school_name_idx ON schools (school_name);
```

This will create a general purpose [B-tree](https://www.postgresql.org/docs/current/static/indexes-types.html) index on the column 'school' which we will want to make searchable.  In the absence of an index, queries involving comparison or equality operations will need to examine each row individually, referred to as 'sequential scan'.  In Big-O notation, this is the classic linear search, an 'O(n)' operation.  With our binary tree index, we construct a special sorted representation of our school names in a tree structure which enables the optimizer to use binary search to find any given record.  This operation is roughly 'O(log n)'.  To visualize why this is an important distinction (and why indexes are so powerful), consider the task of finding a specific school in our table of roughly 17,000 school names.  In a sequential scan, the database starts with the first row and simply continues in sequence until it finds the target of the query.  It might get lucky and find the target school in the first row, or it might get unlucky and not find it until reaching the very last row in the table.  In the average case, assuming randomly chosen school names as the target of the query, the database will search half the table to find the target record, so roughly 8,500 row scans per search.

With a binary tree index, the database starts its search by comparing the first character of the target query with the first character of the element at the top of the tree, which in our case will be the school name appearing in the middle of the sorted list of school names.  So, if we're searching for a school name beginning with the letter 'S', and the school at the top of the tree begins with the letter 'M', the database now knows it can ignore all schools in the first half of the index and only consider those schools in the second half, ranging from letters M to Z.  Within the second half, the database again selects the midpoint and after the second comparison will have filtered down to only 25% of the schools.  After the third comparison, only 12.5% of the index remains to be searched, and so on.  This is why binary search is such a powerful algorithm, and why indexes are so important to speed up search queries.  In the worst case (which for binary search is also the average case), it will take log(n) comparisons to find any given school name.  In our table of schools, this amounts to only 14 operations.  Bam! I think it's fairly obvious why this is superior to the 8,500 operations of a linear search.  And yet, the fact that so many websites' search is so slow makes me think there are a ton of sites out there who are simply doing naive sequential scans of their content.

### Basic keyword search

So let's see what happens when we use the LIKE keyword to find an arbitary search string in our table of schools.  In our Django view, we have a 'query' parameter which we will use to query the database with the ORM using the [`contains`](https://docs.djangoproject.com/en/dev/ref/models/querysets/#std:fieldlookup-contains) field lookup.

```python
results = Schools.objects.filter(school__contains=query).values('school', 'city')
```

Stripping away the gratuitous quoting and casting, the ORM will transform that statement into the following query:

```sql
SELECT school, city FROM schools WHERE school LIKE '%alamo%';
```

Here, we're searching for school names containing the string 'alamo'.  Since the 'contains' lookup does not assume any constraints on the location of the search query, it wraps the query term with the '%' wildcard operators and uses a LIKE expression.

Now let's see what Postgres thinks about this query, by analyzing the query plan with `EXPLAIN ANALYZE`.

```text
                                              QUERY PLAN                                               
-------------------------------------------------------------------------------------------------------
 Seq Scan on schools  (cost=0.00..3424.55 rows=2 width=33) (actual time=14.292..14.292 rows=0 loops=1)
   Filter: ((school)::text ~~ '%alam%'::text)
   Rows Removed by Filter: 17724
 Planning time: 0.267 ms
 Execution time: 14.330 ms
```

The most important thing to glean from this query plan is the fact that it is a sequential scan.  There is no way to take advantage of the index because we are using the wildcard '%' operator at the beginning of the query.  Since we are looking for a match anywhere in the string, the only way to do this is by examining each row individually for a possible match.

LIKE queries can be made to use an index if they are "left-anchored" at the beginning of the string.  In other words, if we know what the target column needs to start with, then we can use the index to narrow down the list of candidate matches.  Once we reach the wildcard at the end of the query, we will still need to resort to sequential scan, but at this point the database will only be concerned with records it retrieves from the index that match the beginning of the query.  In Django, we can substitute the 'startswith' lookup instead of 'contains'.

```python
results = Schools.objects.filter(school__startswith=query).values('school', 'city')
```

For some use cases this can be an acceptable compromise, but for most it will be quite limiting.  You wouldn't want to use this to search for a blog entry containing certain keywords, because you'd only be able to match the first word of the entry.  Using `startswith`, the ORM will generate a query like the following:

```sql
SELECT school, city FROM schools WHERE school LIKE 'alamo%';
```

In Postgres, there is an additional trick we need to do in order for this query to make use of an index.  Our basic B-tree index we created above is sufficient for equality and comparison operators (<, <=, =, >=, >) but can't actually work for the ~~ (LIKE) operator because of collation rules.  As explained in the documentation on [Index types](https://www.postgresql.org/docs/current/static/indexes-types.html), "if your database does not use the C locale you will need to create the index with a special operator class to support indexing of pattern-matching queries".  You can verify the locale setting under which your database is operating using the following:

    caledu=> SHOW LC_COLLATE;
     lc_collate  
    -------------
     en_US.UTF-8

Since the default and most widely used locale today is UTF-8, we need to create a special index to support pattern matching operators for varchar columns.

```sql
CREATE INDEX schools_school_varchar_idx ON schools (school varchar_pattern_ops);
```

The key here is the 'varchar_pattern_ops' operator class. Now we can analyze our query plan to see that Postgres will make use of the new index.

```text
                                                             QUERY PLAN                                                              
-------------------------------------------------------------------------------------------------------------------------------------
 Index Scan using schools_school_varchar_idx on schools  (cost=0.29..8.31 rows=2 width=33) (actual time=0.011..0.011 rows=0 loops=1)
   Index Cond: (((school)::text ~>=~ 'alamo'::text) AND ((school)::text ~<~ 'alamp'::text))
   Filter: ((school)::text ~~ 'alamo%'::text)
 Planning time: 0.629 ms
 Execution time: 0.045 ms
```

You can find more information in the documentation about [Index Scans](https://www.postgresql.org/docs/current/static/index-scanning.html).  Note the dramatically lower execution time (0.045 ms) compared to the sequential scan above (14.330 ms).  Making use of an index can reduce the number of comparison operations by multiple orders of magnitude.

So now we've transformed our search query to make use of an index, but at the cost of severely constrained functionality.  Recall that the second issue with LIKE queries we identified above is the problem of case sensitivity.  Our queries as written will only return results where each character of the user-provided search term exactly matches the target column case by case.  This ain't gonna cut it as most users expect their search queries to be case insensitive.  We can ameliorate this by using the case insensitive versions of these two field lookups:  'icontains' and 'istartswith'.  

```python
results = Schools.objects.filter(school__istartswith=query).values('school', 'city')
```

The ORM accomplishes case insensitive searching by wrapping both the query and the target column with the UPPER() text function:

```sql
SELECT school, city 
FROM schools 
WHERE UPPER(school) LIKE UPPER('alamo%');
```

Unfortunately, this blows away any chance of using an index since the database has no choice but to perform the expensive case conversion function on every row before it can make the comparison against the search query.  Once again we're back in sequential scan territory.

```text
                                              QUERY PLAN                                               
-------------------------------------------------------------------------------------------------------
 Seq Scan on schools  (cost=0.00..3468.86 rows=89 width=33) (actual time=5.998..20.760 rows=6 loops=1)
   Filter: (upper((school)::text) ~~ 'ALAMO%'::text)
   Rows Removed by Filter: 17718
 Planning time: 0.202 ms
 Execution time: 20.786 ms
```

Our execution time also increased by about 45%, the extra cost of applying the `UPPER()` function on each row on top of the sequential scan makes this a lot more expensive.

### There's got to be a better way!  Enter full text search...

In order to get acquainted with full text search in Postgres and Django, be sure to read the documentation.  There's no magic that I'm using here that isn't already well explained in the docs.  In Django, first see the [Search Topic guide](https://docs.djangoproject.com/en/dev/topics/db/search/) which presents a brief overview of your options.  Next, read the full text search documentation in both the [Django](https://docs.djangoproject.com/en/dev/ref/contrib/postgres/search/) and [Postgres](https://www.postgresql.org/docs/current/static/textsearch.html) docs.  

To make use of full text search in Django, include `'django.contrib.postgres'` in your `INSTALLED_APPS` settings module.  The `search` lookup is a drop-in replacement for `contains` but opens up a world of new functionality.

```python
results = Schools.objects.filter(school__search=query).values('school', 'city')
```

Here is what the Django ORM will generate for this query set:

```sql
SELECT school, city 
FROM schools 
WHERE to_tsvector(COALESCE(school, '')) @@ (plainto_tsquery('alamo')) = true;
```

To accomplish the search, the ORM wraps the target column in a call to the `to_tsvector` function, and wraps the search term in a call to `plainto_tsquery`.  These functions convert the search query and target to the appropriate full text search data types and then applies the match operator `@@` between them.  If the search query includes multiple whitespace separated words, the `plainto_tsquery` function will insert the `&` operator between them so that the search will only match if all words are present in the target column.

Now let's take a look at the query plan:

```text
                                              QUERY PLAN                                               
----------------------------------------------------------------------------------------------------------
 Seq Scan on schools  (cost=0.00..12286.55 rows=89 width=33) (actual time=29.272..152.950 rows=6 loops=1)
   Filter: (to_tsvector((COALESCE(school, ''::character varying))::text) @@ plainto_tsquery('alamo'::text))
   Rows Removed by Filter: 17718
 Planning time: 4.234 ms
 Execution time: 152.977 ms
```

As we can see we are back to a sequential scan and our execution time has increased dramatically.  This query takes about 10x longer than our first LIKE query using the `contains` lookup.  There are two ways we can proceed to optimize this.  First, we need to figure out a way for the full text search engine to use an appropriate index.  Second, since the `to_tsvector` function is being applied on every row with every execution of the search query, we can factor this out by precomputing the vectorized form of the target column.

Both of these tasks can be accomplished in Postgres rather easily, but we will need to get a little messy in Django in order to write the queries efficiently.  The [Creating Indexes](https://www.postgresql.org/docs/current/static/textsearch-tables.html#TEXTSEARCH-TABLES-INDEX) section of the Postgres docs describes what we need to do for indexed full text search operations.  We will create an index of type [Generalized Inverted Index](https://www.postgresql.org/docs/current/static/textsearch-indexes.html) or 'GIN'.

```sql
CREATE INDEX schools_gin_idx ON schools USING GIN (to_tsvector('english', coalesce(school, '')));
```

The documentation explains that we must supply a configuration name (here 'english') when creating the index.  This also means in order to use the index, our queries must also supply this configuration name.  At present, the Django API for the `search` lookup does not allow for including the configuration name.  So even after creating this index, our queries using the `search` lookup as shown above will continue to use sequential scan.  As a first step, we can work around this limitation by using the [extra()](https://docs.djangoproject.com/en/dev/ref/models/querysets/#django.db.models.query.QuerySet.extra) QuerySet modifier.

```python
results = Schools.objects.extra(where=["to_tsvector('english', coalesce(school, '')) @@ (plainto_tsquery(%s)) = true"], 
    params=[query]).values('school', 'city')
```

This will now generate the following SQL statement:

```sql
SELECT school, city 
FROM schools 
WHERE to_tsvector('english', COALESCE(school, '')) @@ (plainto_tsquery('alamo')) = true;
```

Now if we analyze our query plan we see that this query is using our newly created index and the execution time is vastly reduced.

```text
                                                                 QUERY PLAN                                                                 
--------------------------------------------------------------------------------------------------------------------------------------------
 Bitmap Heap Scan on schools  (cost=12.94..366.79 rows=89 width=33) (actual time=0.030..0.039 rows=6 loops=1)
   Recheck Cond: (to_tsvector('english'::regconfig, (COALESCE(school, ''::character varying))::text) @@ plainto_tsquery('alamo'::text))
   Heap Blocks: exact=6
   ->  Bitmap Index Scan on schools_gin_idx  (cost=0.00..12.91 rows=89 width=0) (actual time=0.024..0.024 rows=6 loops=1)
         Index Cond: (to_tsvector('english'::regconfig, (COALESCE(school, ''::character varying))::text) @@ plainto_tsquery('alamo'::text))
 Planning time: 0.122 ms
 Execution time: 0.063 ms
```

In the documentation for `extra` you may have noticed the big warning to "Use this method as a last resort".  The Django developers are not so keen on using the extra QuerySet modifier because it is an old and somewhat dangerous API.  They would actually prefer people to use [RawSQL](https://docs.djangoproject.com/en/dev/ref/models/expressions/#django.db.models.expressions.RawSQL) if the standard queryset methods are insufficient to express the query you want to write with the ORM.  Fortunately, Django provides the `SearchVector` class which will allow us to avoid having to use `extra()`.  `SearchVector` allows us to pass in the configuration name of the search, thus we can still take advantage of the index.

```python
results = Schools.objects.annotate(search=SearchVector('school', config='english')).filter(search=query).values('school', 'city')
```

This statement will produce the same query plan as above, making use of the index, but now we have a much cleaner use of the Django API.

Let's take a moment to review the shortcomings we identified above using the `search` lookup with LIKE queries.  Our full text search using `SearchVector` solves the critical index issue, as we now have a GIN index which our search queries are using.  Case sensitivity is also built into full text search because the engine normalizes all text to a single case when preprocessing.  Likewise, the issue of word boundaries is handled in full text search when the target colunm is parsed into tokens.  

There are only two issues remaining in the list with which we haven't yet dealt: ordering search results by relevance and searching across multiple columns.  Fortunately, both Postgres and the Django API let us add these features easily.

### Ranking of Search Results

One of the most interesting features of full text search is the ability to score search query results with a numeric relevance score indicating how similar the result is to the query.  Postgres implements a ranking function [`ts_rank`](https://www.postgresql.org/docs/current/static/textsearch-controls.html#TEXTSEARCH-RANKING) which can be returned along with the results of each search.  Django interfaces with this function using the [`SearchRank`](https://docs.djangoproject.com/en/dev/ref/contrib/postgres/search/#searchrank) class.  We can now amend our search query by annotating the queryset with a `SearchRank` and then order the queryset in descending order of the rank value.

```python
search_vector = SearchVector('school', config='english')
results = Schools.objects.annotate(search=search_vector, rank=SearchRank(search_vector, query)).filter(search=query).order_by('-rank').values('school', 'city')
```

This will generate a query like the following:

```sql
SELECT school, city 
FROM schools 
WHERE to_tsvector('english'::regconfig, COALESCE(school, '')) 
    @@ (plainto_tsquery('english'::regconfig, 'alamo')) = true 
ORDER BY 
    ts_rank(to_tsvector('english'::regconfig, COALESCE(school, '')), plainto_tsquery('alamo')) DESC;
```

Note that `ts_rank` only appears in the `ORDER BY` clause.  The `WHERE` clause is the same as earlier because we continue to use our `SearchVector` as the filter.  Let's look at the query plan.

```text
                                                                   QUERY PLAN                                                                   
------------------------------------------------------------------------------------------------------------------------------------------------
 Sort  (cost=391.89..392.12 rows=89 width=37) (actual time=0.208..0.210 rows=6 loops=1)
   Sort Key: (ts_rank(to_tsvector('english'::regconfig, (COALESCE(school, ''::character varying))::text), plainto_tsquery('alamo'::text))) DESC
   Sort Method: quicksort  Memory: 25kB
   ->  Bitmap Heap Scan on schools  (cost=12.69..389.01 rows=89 width=37) (actual time=0.078..0.190 rows=6 loops=1)
         Recheck Cond: (to_tsvector('english'::regconfig, (COALESCE(school, ''::character varying))::text) @@ '''alamo'''::tsquery)
         Heap Blocks: exact=6
         ->  Bitmap Index Scan on schools_gin_idx  (cost=0.00..12.66 rows=89 width=0) (actual time=0.027..0.027 rows=6 loops=1)
               Index Cond: (to_tsvector('english'::regconfig, (COALESCE(school, ''::character varying))::text) @@ '''alamo'''::tsquery)
 Planning time: 0.246 ms
 Execution time: 0.267 ms
```

The inner stages of the query plan are identical to those above, and now they have been wrapped by a quicksort using the `ts_rank` value as the key.  This is still a fast query because the filter operations will use the index we already have in place.  Quicksort then takes the reduced set of matches and sorts them by the value of the search rank.  As long as the search query filter returns a relatively small number of matches, the extra operations imposed by sorting will have a minimal impact on performance, at the benefit of providing the user with more relevant records at the top of the result set.

### Search with Multiple Columns

Multi-column search can arise anytime it makes sense to allow the user to search for keywords that may be physically stored in different columns.  In a blog model for example, it would be convenient to search in both the title and text of the blog entries.  In my example use case, I would like the user to be able to search for either school names or the city in which they're interested.  

There are two possible approaches to full text search across multiple columns in a table.  The first option is to specify a new index as a concatenation of the columns of interest.  For this to work, you must specify the configuration (again, we're using 'english' in these examples), and it is also important to include a space between the columns.  If you fail to add the space, there will be no separation between the last word in the first column and the first word of the next which will obviously cause problems when attempting to search for specific words.

```sql
CREATE INDEX mc_idx ON schools USING GIN (to_tsvector('english', COALESCE(school, '') || ' ' || COALESCE(city, '')));
```

To take advantage of this new index, we merely need to specify both columns in the construction of the SearchVector.

```python
results = Schools.objects.annotate(search=SearchVector('school', 'city', config='english')).filter(search=query).values('school', 'city')
```

This will generate a query like the following:
    
```sql
SELECT school, city  
FROM schools 
WHERE to_tsvector('english'::regconfig, COALESCE(school, '') || ' ' || COALESCE(city, '')) 
    @@ (plainto_tsquery('english'::regconfig, 'alamo')) = true;
```

And we can then verify that the planner will use the new multi-column index when executing the search query:

```text
                                                                                             QUERY PLAN                                                                                             
----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 Bitmap Heap Scan on schools  (cost=12.69..344.74 rows=89 width=33) (actual time=0.067..0.085 rows=12 loops=1)
   Recheck Cond: (to_tsvector('english'::regconfig, (((COALESCE(school, ''::character varying))::text || ' '::text) || (COALESCE(city, ''::character varying))::text)) @@ '''alamo'''::tsquery)
   Heap Blocks: exact=9
   ->  Bitmap Index Scan on mc_idx  (cost=0.00..12.66 rows=89 width=0) (actual time=0.054..0.054 rows=12 loops=1)
         Index Cond: (to_tsvector('english'::regconfig, (((COALESCE(school, ''::character varying))::text || ' '::text) || (COALESCE(city, ''::character varying))::text)) @@ '''alamo'''::tsquery)
 Planning time: 0.300 ms
 Execution time: 0.156 ms
```

An alternative method is to create a new column of type `tsvector` and then create the GIN index on the new column.  This has the advantage of pre-computing the parsed vector of the target search columns.  The advantage is not huge since we're already using an index for the majority of our search operations, but having the pre-computed vector means that any subsequent sequential scans can be performed very quickly.  The downside of this approach is that updates to the source columns will require a trigger to update the `tsvector` column.  You can read more about this in the section on [triggers for automatic updates](https://www.postgresql.org/docs/current/static/textsearch-features.html#TEXTSEARCH-UPDATE-TRIGGERS).


```sql
ALTER TABLE schools ADD COLUMN school_city_idx tsvector;
UPDATE schools 
    SET school_city_idx = to_tsvector('english', coalesce(school, '') || ' ' || coalesce(city, ''));
CREATE INDEX mc_idx2 ON schools USING GIN (school_city_idx);
```

Before using the new column in our Django view, we need to add it to the model class.  The new column is of type `tsvector` which in Django can be represented with the `SearchVectorField` class:

```python
# models.py
from django.contrib.postgres.search import SearchVectorField

class Schools(models.Model):
    ...
    school_city_idx = SearchVectorField()
```

Now we can very simply reference the new search vector column in our view function.

```python
results = Schools.objects.filter(school_city_idx=query).values('school', 'city')        
```

This will generate a query like the following.

```sql
SELECT school, city 
FROM schools 
WHERE school_city_idx @@ (plainto_tsquery('alamo')) = true;
```

And we can verify that the plan looks good.

```text
                                                    QUERY PLAN                                                     
-------------------------------------------------------------------------------------------------------------------
     Bitmap Heap Scan on schools  (cost=12.34..61.29 rows=12 width=33) (actual time=0.031..0.050 rows=12 loops=1)
       Recheck Cond: (school_city_idx @@ plainto_tsquery('alamo'::text))
       Heap Blocks: exact=10
       ->  Bitmap Index Scan on mc_idx2  (cost=0.00..12.34 rows=12 width=0) (actual time=0.024..0.024 rows=12 loops=1)
             Index Cond: (school_city_idx @@ plainto_tsquery('alamo'::text))
     Planning time: 0.318 ms
     Execution time: 0.072 ms
```


### Prefix Match

If you've followed everything up to this point you should be in an excellent position to use full text search in Postgres and Django.  Let's review what we've been able to accomplish so far.  Using full text search with Django's `search` lookup, we can offer users a much better alternative to standard LIKE queries.  Users do not have to worry about case sensitivity, can quickly find terms located in arbitrary positions within the target text, and with linguistic stemming we normalize different variations of the same root word down to a common base.  With `SearchVector`, we have more control over the configuration of the search, allowing for indexes and the ability to search across multiple columns.  With `SearchRank` we can order our search results by relevance so that the most interesting results can be shown first in the output of the query.  Finally, since Postgres provides powerful indexing capabilities, we can ensure that all of our searches are highly efficient and will return results to the user very quickly.

There is one additional example I'd like to walk through which relates back to my original idea of providing an autocomplete feature.  Autocomplete is a convenience feature that users have now come to expect from a proper search box, but it presents some additional interesting challenges to the application developer.  Instead of waiting for the user to finish typing their search query and submit with a button click, we want to intercept the search query as soon as possible---perhaps after just 2 or 3 characters---then send the partial search to the backend with an ajax call, and return a list of possible matches to the browser so the user can short-circuit their search and possibly find what they're interested in before they've even finished typing.  If you want to get serious about search, you'll definitely want to consider implementing an autocomplete feature.

In order to make this work, we'll have to do a little messing around with the queries generated by the Django ORM.  To illustrate the basic problem, take a look at the following four queries.

```sql

SELECT count(1) FROM schools WHERE school_city_idx @@ (plainto_tsquery('mission')) = true;
 count 
-------
    71

SELECT count(1) FROM schools WHERE school_city_idx @@ (plainto_tsquery('mission viejo')) = true;
 count 
-------
    30

SELECT count(1) FROM schools WHERE school_city_idx @@ (plainto_tsquery('mission viej')) = true;
 count 
-------
     0

SELECT count(1) FROM schools WHERE school_city_idx @@ (to_tsquery('mission & viej:*')) = true;
 count 
-------
    30
```

The first query shows us that there are 71 schools containing the normalized word token `'mission'` appearing in our index which combines both the school name and city.  In the second query, we see there are 30 schools that are matches for the query `'mission viejo'`.  If our goal is to provide an autocomplete feature, we'll want to be able to suggest these 30 schools as potential matches even before the user has completed typing the second word.  Note, however, in the third query, if we search for 'mission viej', our query returns zero results.  To understand why, we must recall how the `plainto_tsquery` function works.  After tokenization and stemming, individual words in a call to `plainto_tsquery` are separated by the `&` operator.  All words in the search query must be present in the target column in order to trigger a match.  Using this function, there is no way to search for matches on partial words.  

Now, take a look at the fourth query in the example above.  This query returns the 30 schools that match `'mission viejo'` with a prefix match on the second word.  We can do partial word matches using the `*` prefix match operator, which works very similarly to the `%` wildcard operator using LIKE queries, except it operates on individual tokens rather than the entire text of the column.  Unfortunately, we can't use prefix match operators with `plainto_tsquery`, which is what the Django ORM uses to transform search queries.  However, Postgres provides the more powerful `to_tsquery` function, which does allow access to prefix match operators.  A search for `'viej:*'` will match all tokens that begin with `'viej'`.  This will allow us to redesign our search query to write a view function suitable for use in an autocomplete ajax call.

Since we need to bypass the ORM, we'll need to resort to the `extra` queryset modifier.  Note that it's entirely possible to extend Django's API to account for this use case, but that's a bit beyond our present scope!  For the moment, we'd just like to get this working.  What we'd like to do is take the user's query, which may contain multiple words separated by whitespace.  We'll split the query into individual words, separate the tokens with the `&` operator, and then append the prefix match operator `':*'` to the final term so that partial matching will occur on the last word the user has or is typing.  Then, we'll pass this to the `to_tsquery` function.  Putting this all together, our ajax view will look something like this:

```python
# with prefix match
query_terms = query.split()
tsquery = " & ".join(query_terms)
tsquery += ":*"
results = Schools.objects.extra(where=["school_city_idx @@ (to_tsquery(%s)) = true"], 
    params=[tsquery]).values('school', 'city')
```

This will generate a query like the following:

```sql
SELECT school, city 
FROM schools 
WHERE (school_city_idx @@ (to_tsquery('mission & viej:*')) = true);
```

And once again, we verify that our query plan uses our index so it will work very efficiently.

```text
                                                    QUERY PLAN                                                    
------------------------------------------------------------------------------------------------------------------
 Bitmap Heap Scan on schools  (cost=32.25..36.51 rows=1 width=33) (actual time=0.110..0.151 rows=30 loops=1)
   Recheck Cond: (school_city_idx @@ to_tsquery('mission & viej:*'::text))
   Heap Blocks: exact=8
   ->  Bitmap Index Scan on mc_idx2  (cost=0.00..32.25 rows=1 width=0) (actual time=0.099..0.099 rows=30 loops=1)
         Index Cond: (school_city_idx @@ to_tsquery('mission & viej:*'::text))
 Planning time: 0.550 ms
 Execution time: 0.197 ms
(7 rows)
```

I hope this has given you a basic introduction to the wealth of full text search features that Postgres and Django offer.

Happy searching!
