---
layout: post
title: Big data is a terrible term
date: 2014-01-26
topics: data
---
The term 'big data' sounds infantile, like 'My Computer'.  It should hurt the ears of anyone with any appreciation of Style.  This is a buzzword that deserves to be cast into the dustbin of discarded buzzwords as quickly as we can possibly do so.  On the way, I'd like us all to consider that maybe 'medium data' isn't getting all the attention that it deserves. 

<!--excerpt-->

The term 'big data' sounds infantile, like 'My Computer'.  It should hurt the ears of anyone with any appreciation of Style.  This is a buzzword that deserves to be cast into the dustbin of discarded buzzwords as quickly as we can possibly do so.  On the way, I'd like us all to consider that maybe 'medium data' isn't getting all the attention that it deserves. 

There's an old joke about the guy driving down the highway when an alert comes on the radio warning to be on the lookout for "a crazed lunatic driving the wrong way," at which he mutters to himself while fiercely gripping the steering wheel, "One crazed lunatic?  Are you kidding me, there are *thousands* of them!"  This is the way I feel about the term 'big data'.  It is wrong on multiple levels and yet has gained such momentum that the reasonable data analyst is left fighting a stream of wrong-way drivers who make no attempt at righting their course.



## A grade school lesson in grammar



The first issue I have with 'big data' is grammatical.  'Data' is a difficult word owing to its Latin origin as the plural form of the now very archaic and pretentious sounding 'datum'.  One may wonder why the plural isn't something more Latin-looking like 'datae' or 'datumus', but such questions are better left in the hands of someone whose study of Latin went somewhat beyond one semester in the 7th grade.  Syntactic pedants are quick to insist that the term 'data', being plural, must not be carelessly used as a singular noun and that "this data shows ..." is incorrect while "these data show ..." is the proper application.  I will admit to being inconsistent in this usage, wavering back and forth between the two since the correct usage often sounds awkward and seems merely to highlight the speaker's grasp of this grammatical nuance at the expense of the actual meaning one is attempting to convey.



Regardless of your position on whether 'data' should always be plural or can acceptably be used in the singular, it is still a gross violation of grammatical form to use adjectives like 'big' or 'small' in reference to 'data'.  Not being a professional linguist, my initial inclination was to classify the word 'data' as a collective noun.  This is not entirely accurate however as I learned from wikipedia which for lack of a freshman English textbook I temporarily nominate to be a de facto professional linguist.  From this authority I learned that 'data' is actually a [mass noun][massnoun] which means that "any quantity of it is treated as an undifferentiated unit, rather than as something with discrete subsets."  Examples of mass nouns include 'evidence', 'water', and 'pollution'.  You wouldn't say 'big evidence' or 'small pollution' because those adjectives can only be used with discrete nouns.  A dataset can be big or small, because a dataset is a discrete unit.  But, it is nonsensical to refer to data itself (er, themselves) as being big.



When I hear the term 'big data' I imagine someone sitting in front of an Excel spreadsheet, selecting all the cells and changing the font size to Arial 48.  Now that's some big data!  The term simply sounds childish and it is unfortunate that it has gained currency to refer to a set of technologies that supposedly represents the cutting edge.



## Big data's claims to novelty



Apart from grammatical quibbles, which, despite their correctness will never win any arguments and may indeed result in a loss of respect -- see 'syntactic pedants' above -- there is another more important dimension to the failure of this term from my perspective as an analyst working in the field that spawned it.  'Big data' is touted as something novel and revolutionary, as if it signals a new dawn for data analysis whose adherents to this new religion are the new messiahs alone able to deconstruct the brave new world of data heretofore hidden by the old school mired in their provincial study of 'small data'.



Let's try to pick apart what this new movement is so excited about when they use the term 'big data'.  Clearly, there is an emphasis on the fact that there is a lot of data.  If the new religion had rallied around the term 'big datasets', then my grammatical concerns would have been alleviated but despite its correctness, I think we can all agree that this doesn't really have the same ring to it.  But it still remains true that one of the common themes of the 'big data' movement is that the volume of data has exploded beyond the usual capacities we have for processing it.  Thus, perhaps we could elucidate big data to mean *"a volume of data that is large enough such that traditional methods for analyzing it are insufficient."*  This definition seems to me to adequately capture the major thematic concern of the big data proselytizers.  Unfortunately, if this is what big data boils down to, then there is nothing new involved at all.  



Another of big data's claims regarding its novelty is that there is so much more data available today than in years past.  "Storage volumes have exploded at unprecedented rates in recent years."  The problem is, this quote was as accurate in 1978 as it is today.  Data volumes have always been larger than conventional processing tools, or rather, hard problems have always required data that was larger than what conventional processing tools were able to provide.  This is almost tautological, because if large volumes of data did not require specialized processing then there would be no research or innovation into specialized processing for large volumes of data.  The fact that this space is full of innovation is precisely because ordinary infrastructure is constantly being pushed to the limit to handle the current load, let alone anticipating the needs of the future.



One day in grad school I discovered in the back of a storage closet a long lost collection of datasets stored on reel to reel tape.  I felt like an archaeologist even though they were barely fifteen years old.  At a time when hard drive capacities were measured in tens of megabytes and internet connection speeds were measured in baud, distributing the Decennial Census was a big data problem.  Expensive devices were needed to access the data, and analyzing the data typically implied a program stamped onto a set of punch cards and fed into a mainframe.  That was big data in the 1980s.  Today the scales involved have changed, but the fundamental approaches have not.  



So, if it represents anything new, then big data must be about more than just big datasets.  What new technologies fit under the rubric of big data?  I would wager that the most popular response among big data practitioners if asked what technologies are most representative of the term would be hadoop.  Hadoop is clearly one of the most significant innovations to emerge in our industry in a generation.  But if big data is just hadoop, why don't we just call it hadoop?



No, the apostles say, big data is more than just hadoop, it's also NoSQL.  While my attitude towards the term 'big data' is one of mild discomfort, the term 'NoSQL' evokes in me a much stronger reaction, much like the way one would react to the smells emanating from the NYC subway on a hot summer day.  But the current rant is about big data, so NoSQL will have to wait its turn for its well-deserved skewering.  The short answer is, of course, that NoSQL is not a new technology.  Berkeley DB is one of, if not the, original key-value store database with a lineage that dates back to the late 1980s.  Richard Stevens in _Advanced Programming in the UNIX Environment_ introduced a simple, efficient database library in 1993.  It may not have all the distributed features of modern day document stores, but the essential model for how data is stored and accessed is the same.



Ok, so NoSQL doesn't lend any novelty to the term big data, but what about machine learning?  While not part of every big data infrastructure, ML is often the intended purpose of a hadoop or NoSQL pipeline.  While there continue to be cleverer ways of connecting the dots, machine learning has its roots in statistical techniques many of which date to the 1970s and earlier.  See [AIAMA][aiama] for a painstakingly well-researched and comprehensive survey of the diversity of techniques and approaches to 'big data' problems that have emerged from multiple disciplines over the past half century.  To be ignorant of this history is to fail to see our work in its proper context.  It also gives us a false sense of superiority and self-importance to think we were the first people who figured out how to do this.  Keep this in mind the next time you hear "Now, it's all about big data".   The same was true in 1978.  For me, big data is nothing new, it's just business as usual.



## Focus on what's more important: 'medium' data



Lastly, I have a conceptual issue with big data that persists even if we put aside syntactical pedantry and even if we all admit that big data is simply a new buzzword wrapped around the same approaches to data analysis that have been used for decades.  For me, the idea of 'medium data' is far more important.  I will use a simple analogy to illustrate the basic idea:  big data is a WAV file while medium data is an mp3.  Big data is 99% noise.  If we concentrate too much on the storage and processing of all of the available raw data at our disposal, we lose the fact that only a small subset is actually useful in making any kind of sense of things.  This is definitely a controversial claim and I submit this for general discussion--it is far more worthy of our time than the above paragraphs that amount to wrist-slapping for grammatical mistakes and head-shaking about the abuse of a buzzword.



There are certainly use cases where my argument falls apart.  For instance, if you are doing product recommendations, then you need to start with the complete matrix of item to item relationships.  Even if you hone the algorithm on a smaller more manageable subset of the data, it still needs to be applied to the full dataset, and this then becomes a proper big data problem.  One could also argue that even if big data is a WAV file and all you care about is the mp3 representation of the important signal, you still need to start with the WAV file in order to generate the mp3 in the first place.



The unfortunate side effect of emhasizing the bigness in big data is that we expend so much time, energy, and money to handle scale, and this ends up overshadowing the more subtle work that needs to happen to make real breakthroughs in understanding the data.  Real insight comes from working closely with a small number of well-chosen variables and a subset of meaningful records.  Getting the data into such a frame requires an equal level of effort, but can be overlooked if all resources have been expended in storing a massive trove of largely irrelevant raw data.  I'm not trying to demean or call into question the work required in big data problems, but merely to highlight that when it comes to data analysis, size doesn't matter.  It's what you do with it.



[massnoun]: http://en.wikipedia.org/wiki/Mass_noun

[aiama]: http://aima.cs.berkeley.edu/

