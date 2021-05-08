---
layout: post
title: Obfuscating your Primary Keys
date: 2021-05-07
topics: web
---

One of the most common follow-up feature requests I get from clients after building a web application is to make urls containing model ids more appealing.  Nothing screams "we are amateurs!" like inviting a new user to your website and redirecting them to `/users/4/` or sending a customer a billing invoice at `/invoices/12/` or linking to a page on your new photo-sharing site at `/photos/31/`.  This is a common problem that affects database-backed web applications that need to surface permalinks to content that is accessed with a primary key embedded in the url.  This can be anything with a "Detail Page" view---users, products, orders, comments, photos, profiles, posts, etc.  In this post I would like to share my own research into this question with discussion of the options you might consider depending on your use case.

<!--excerpt-->

One of the most common follow-up feature requests I get from clients after building a web application is to make urls containing model ids more appealing.  Nothing screams "we are amateurs!" like inviting a new user to your website and redirecting them to `/users/4/` or sending a customer a billing invoice at `/invoices/12/` or linking to a page on your new photo-sharing site at `/photos/31/`.  This is a common problem that affects database-backed web applications that need to surface permalinks to content that is accessed with a primary key embedded in the url.  This can be anything with a "Detail Page" view---users, products, orders, comments, photos, profiles, posts, etc.  In this post I would like to share my own research into this question with a discussion of the options you might consider for different use cases.

In various forms, this question has been around for a very long time and has been asked numerous times on Stack Overflow
[[1]](https://stackoverflow.com/questions/1895685/should-i-obscure-primary-key-values),
[[2]](https://stackoverflow.com/questions/8554286/obfuscating-an-id),
[[3]](https://stackoverflow.com/questions/8755713/user-id-obfuscation),
[[4]](https://stackoverflow.com/questions/57529162/masking-an-auto-incrementing-primary-key),
Security Stack Exchange
[[5]](https://security.stackexchange.com/questions/56357/should-i-obscure-database-primary-keys-ids-in-application-front-end),
[[6]](https://security.stackexchange.com/questions/116272/is-there-any-concern-regarding-a-database-primary-key-exposure),
[[7]](https://security.stackexchange.com/questions/241018/should-i-obscure-database-primary-keys-for-the-frontend-even-if-these-ids-are-uu)
[[8]](https://security.stackexchange.com/questions/108028/sequential-identifying-string-that-cant-be-reverse-engineered-the-invoice-num),
DBA Stack Exchange
[[9]](https://dba.stackexchange.com/questions/217476/efficient-primary-key-that-does-not-expose-business-internals),
[[10]](https://dba.stackexchange.com/questions/224652/good-practice-for-hiding-primary-keys-from-a-client),
[[11]](https://dba.stackexchange.com/questions/268394/hash-ids-such-as-base64-youtube-video-ids-store-as-int-bigint-or-as-string),
[[12]](https://dba.stackexchange.com/questions/122915/random-numeric-string-as-a-primary-key-security-performance-efficiency),
and in various other forums
[[13]](https://www.reddit.com/r/PostgreSQL/comments/6gw866/best_practice_for_id_system_that_is_obscure_for/),
[[14]](https://softwareengineering.stackexchange.com/questions/139450/is-obscuring-obfuscating-public-facing-database-ids-really-a-best-practice/139453),
[[15]](https://www.indiehackers.com/post/do-you-obfuscate-your-resource-ids-19f4ce1664).

Many of these questions are motivated by similar concerns raised by my clients---how can we make ids in urls that make the site look a bit less lonely and a bit more professional?  However, this is more than merely a cosmetic or aesthetic issue because information leaked by urls can be damaging when used in enumeration attacks.  As an application developer you are surely protecting your site against [username enumeration attacks](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/03-Identity_Management_Testing/04-Testing_for_Account_Enumeration_and_Guessable_User_Account), but similar techniques can also be used to reveal sensitive information about your customers, your products, or your business, when directed against other areas of your site that you may not think of securing as tightly as user access.

The most obvious example of information leakage here is traffic or volume.  When using simple auto-incrementing integers, you not only give away the total number of existing ids everytime someone creates one, you also reveal the [rate of creation](https://www.twilio.com/blog/2009/05/obfuscate-your-company.html) when someone waits a week and checks to see how many new ids have been created in the meantime.  But even if you don't care about revealing this information, there is guaranteed to be a bored script-kiddie out there who will spot your sequential ids and proceed to slam your site with DDOS-level requests for every possible unsigned 32-bit integer on the off chance they might discover something interesting.  Just for the lulz.  Or, another may decide to simply scrape your entire product database and spin up their own copy somewhere else.  There are other more subtle information "locality" leaks that you really have no way of knowing in advance what trouble they might lead to.  Sequential ids make it easier to guess the id range of another user's resources.  They also reveal which of two objects was created first, or which other objects were created around the same time.

Some commenters have the mistaken belief that exposing the primary key of one of their database tables is a security breach.  This may be true if you are using a natural primary key such as a social security number, but if you have technical primary keys implemented as simple auto-incrementing serials, then there is nothing special about them at all.  Knowing that my customer_id in your database is `1334234` is useless to me or to anyone else, apart from the fact that it is used to access a particular web page.  Obscuring that primary key with some alternate hashed representation like `sdhkj478s` presents essentially the same risk.  In either case, there exists a mechanism to lookup a customer record using that identifier.  The id itself is not a secret.  However, the *process of generating* ids is what may need to be guarded in order to prevent the various forms of information leakage noted above.

Responses to this question are often filled with harsh criticism and strong warnings that 'obscurity is not security!'.  Reliance on obscurity to prevent unauthorized users from viewing secrets is hopefully not a mistake that you will make.  I  assume that you have meticulously reviewed the security section of the documentation of any web application framework you are using, that you are aware of and know how to protect against all the attacks listed in the [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/), that you never hard-code credentials into source code, you know the difference between authn and authz, you never say 'hacker' when you mean 'cracker', etc.

But security is hard, really hard.  Exploits have a habit of turning up in ways even a science fiction writer could hardly anticipate.  Witness the [Spectre](https://en.wikipedia.org/wiki/Spectre_(security_vulnerability)) and [Meltdown](https://en.wikipedia.org/wiki/Meltdown_(security_vulnerability)) attacks on Intel CPUs.  You'd have to be some kind of twisted genius to even suspect the attack surface involved here, something that generations of chip designers hadn't even conceived until the attack was revealed.  The very nature of timing attacks and what it takes to guard against them is so antithetical to the typical engineering mindset that they can completely bulldoze our entire sense of security in one shot.  For example, consider how you as an engineer would design a string comparison function.  Surely, you'd aim for it to be as optimal as possible:  terminating immediately upon determining that two strings cannot match.  And this is exactly how optimization minded engineers unwittingly introduce security flaws.  Using your tight optimal string matching function, an attacker can now reverse engineer the credentials to your website by timing the response---one character at a time.

The point is it doesn't matter that it takes an evil genius to discover these flaws:  five minutes after the embargo ends someone has a pre-packaged drive-by exploit that will drain your bank account, revoke your driver's license, subscribe you to spam newsletters, and leave your refrigerator door open and all you did was click on a link to a cute kitten picture.

As a result, I would personally never underestimate the security profession, nor would I dare let my paranoia slip for even a moment to think that my skills are good enough to secure a website against a determined attacker.  Of course, my clients are not holding state secrets, I never store payment instrument details, no PII, no HIPPA or COPPA concerns, and pretty much nothing of interest that could be monetizable outside of my customers' businesses.  But I still fear that one day I might discover one of my site's databases dumped into a pastebin because I wasn't fast enough doing a `dnf update` to correct some obscure security vulnerability in one of the 3,000 packages on the webserver.

So it's not much of a surprise when this question comes up that it is met with a lot of alarm bells and a tendency to assume that the person asking the question has no idea what they're doing and is very liable to end up with their data being actively traded on various dark markets.  The seemingly innocuous goal of substituting sequential integers in urls with an encoded representation is treated as if the question poster had just asked why they can't just `chmod 777 *`, turn off SELinux, and run an anonymous ftp server out of their home directory.

A lot of the skepticism boils down to the fact that obscuring the ids does nothing to change the fact that they are simply identifiers used to access a resource on your site, so what's the point?  Another class of responses addresses solving the information leakage problem by simply using GUIDs.  Recent versions of major RDBMS are now all fairly good with UUID-like datatypes and despite it not being as efficient as simple integers, you are likely never to have a performance issue if set up correctly.

Lastly, after shredding the poster for advocating security through obscurity and proposing GUIDs as the solution to all of life's woes, a lot of the comments in the thread amount to asking "who cares?"  If it's not a security feature and adds no functionality to the site, does it really matter how your urls look?  This is largely a matter of personal preference that each developer will need to decide for themselves.  However, given the number of times I have been approached to "fix" the urls because "they look dumb", I can only suggest that you familiarize yourself with the possibilities because eventually a client or a project manager will come to you with this exact scenario.


I'll explore several different classes of solutions that I've considered for various use cases that are all mainly focused on the cosmetic treatment of ids.

* Tweaking the sequence
* GUIDs
* Hashing techniques
* Irreversible randomness
* Feistel ciphers
* Other ciphers
* Random permutations

## Tweaking the sequence

A simple and unobtrusive way to disguise the paucity of rows in your database that might otherwise be a source of embarrassment to your client is to restart the sequence at a larger number, rather than just 1.

```sql
CREATE SEQUENCE model_id_seq AS int MINVALUE 100000 INCREMENT BY 23;
```

This method will quickly jumpstart your sequence so that your new site looks like it has a bit more history behind it.  By maintaining a monotonically increasing sequence, this method also maintains sort order of the ids.  However, this quickly resembles the "New Checking Account" problem.  In the same way that nobody is fooled into thinking you've written a thousand checks when you hand them one with number 1001, your clients won't be impressed into thinking you've had twenty million jobs when you send them invoice number `20210001`, especially if the next one you send them 4 months later is `20210002`.  Optionally, you could also further tweak the sequence by specifying an increment so that successively generated ids will be incremented by some value more than just 1.

These tweaks might be good enough for your site, but they really don't do much to obscure your traffic because the increment will always result in a regular pattern.  This is also quite wasteful because you will be skipping a large portion of available numbers.  Of course, by the time you reach the 32-bit integer limit, you will surely have a much better plan---and a bigger budget---for dealing with this question!

In conclusion, I would recommend this option only if you're looking for a fast way of introducing some diversity to your id sequence.

## GUIDs

The GUID, or [UUID](https://www.postgresql.org/docs/current/datatype-uuid.html), is a 128-bit number typically represented as 32 hexadecimal characters.  With 5e36 unique available GUIDs, there is virtually no chance of a collision with another GUID well before the end of the universe---assuming the algorithm generating the GUIDs is correctly implemented.  By convention, GUIDs are written in 4 fields separated by dashes so you usually see them occupying 36 characters.  DO NOT store them in your database as `varchar(36)`.  Use a native data type which modern database systems all have available.

Given the extremely low chance of collision, combined with the fact that GUIDs are now well optimized in databases such that they introduce only marginal cost compared to integers, GUIDs are the most commonly suggested solution to the question of obfuscating primary key sequences.  You should definitely consider them when you want to solve this problem in a standard way and you don't mind having this long ugly string in your urls.

While GUIDs easily solve the information leakage problem of an integer sequence, they don't do much for the cosmetic concern.  Now, instead of `/users/4/` you will have urls like `/users/0a28dc8f-53b7-40c3-bb16-2f280412544f`.  I can tell you from experience that the same clients who object to the former will not be too keen on the GUID solution either.  It's not just cosmetic, there's a real usability issue with GUIDs as well.  Basically, you need to be 100% certain that noone will ever want to write down by hand or speak the url, ever.  For example, if you're ever in a situation where a user needs to call customer support and read out their user id, forcing them to read out a GUID over the phone is a textbook case of worst user experience ever.  Another example would be coupon codes or other short codes that need to be not easily guessable.

GUIDs solve the technical problems of the system, but they're horrible for users that need to use those systems.  Since urls constitute part of that human interface, you do need to think through all the possible ways your ids will be needed by humans before committing to GUIDs.  And remember it's not just clients and users who will be judging your site based on urls---other programmers will too.  Every time I see a site using GUIDs for their model ids, I think wow, what a cop-out, the lazy programmers just took the easy way out with these ugly GUIDs.  I bet they also store them in their database as `varchar(36)`.


## Hashing techniques

Another class of solutions to this problem uses modular arithmetic and bit shuffling to obfuscate a number or string in a reversible way that is also not easily reverse engineered.  A popular example is [hashids](https://hashids.org/).  The benefit here is that you can specify an output alphabet to which the input numbers can be matched.  This lets you map your input integers into a condensed alphanumeric string that will be a lot shorter than the input.  These so-called "short codes" are a lot easier for users to handle compared to GUIDs while also retaining a large input space.

The problem with these approaches is that they attempt to imitate crypto without going so far as to implement crypto.  This can easily manifest a false sense of security as you might begin to think that it would be too hard for someone to reverse the algorithm and obtain your original sequence.  Be incredibly wary of this false sense of security because it has already been demonstrated that hashids [is easily broken](https://carnage.github.io/2015/08/cryptanalysis-of-hashids).  Well, maybe not easy for you and me, but for the people who do this sort of thing for a living, it's trivial.  In general, any time you see published tech talks about breaking the security of some system, it means there's a kit circulating in the wild that wraps up the whole exploit into a 7 line shell script.  To you and me it might look like encryption.  But to [Mossad](https://www.usenix.org/system/files/1401_08-12_mickens.pdf), it's no more of a challenge than `rot13`.

Another problem is that home-grown pseudo-crypto like this is horribly inefficient.  Actual cryptography is pretty much by definition very computationally intensive.  Libraries that implement it are also designed to take maximum advantage of the hardware to make cryptographic functions as optimized as possible.  Doing this sort of thing outside of an actual crypto library---in an interpreted language running on a webserver---basically means hammering your CPU every time you need to compute one of these ids.  So, not only do you *not* get the security of actual cryptography, you also waste a lot of resources calculating an obfuscated id that some kid out there can trivially reverse.


## Irreversible randomness

Oftentimes you may want a random id that retains some useful properties of an integer sequence like sortability but doesn't need to be reversible.  In this case, you aren't mapping an input sequence, you simply want to generate a random id on demand and assign it to an object.  This combines the benefit of a large random space---not as large as a GUID but good enough---along with a timestamp so that you can maintain sort order.  The best explanation and example of this approach is described in [this post on the Instagram Engineering](https://instagram-engineering.com/sharding-ids-at-instagram-1cf5a71e5a5c) blog.  There's another good discussion [here](https://rob.conery.io/2014/05/29/a-better-id-generator-for-postgresql/), and [another similar example](https://gist.github.com/mikelehen/3596a30bd69384624c11) as implemented by Firebase.

This technique was developed for dealing with massive scale, when you would ordinarily turn to a GUID but want to maintain time-ordered sortability while thousands of objects are being created every second.  Such environments are very likely using sharding because this kind of scale can't be managed on a single database server.  As a result, you can't have a primary key sequence that can orchestrate the assignment of unique ids across shards.

Even though none of my sites has anywhere near this kind of scale, I've used this technique in a few places because the effect does lend an air of professionalism.  You have very large numbers incrementing in an unpredictable way over time.  This method provides a nice illusion that there's a massive scale in operation behind your modest objects.


## Feistel ciphers

[Feistel ciphers](https://en.wikipedia.org/wiki/Feistel_cipher) are a nifty way of mapping an arbitrary sequence to a non-cyclical permutation within the same range.  This method is a lot more flexible and thus can cover more use cases than any of the other techniques described thus far.  It works well not only for obfuscating primary keys, but also for generating short codes, coupon codes, or something like a "license plate" format.  You can also use this quite effectively for small input ranges, say only the numbers from `100000` to `999999`.

Feistel ciphers are a method of [format-preserving encryption](https://en.wikipedia.org/wiki/Format-preserving_encryption), meaning the output range is the same as the input range.  Moreover, the result is fully reversible and unique:  each input maps to exactly one output and vice versa.  Bearing in mind that anything with a small key size can probably be broken by brute force, Feistel ciphers are much more difficult to decipher compared to something like hashids.  The calculation is also not particularly intense which means you get almost all the benefits of a random permutation without trading off any of the time or storage requirements.

The implementation I like the most and have used in production numerous times is Daniel Vérité's PostgreSQL extension [permuteseq](https://github.com/dverite/permuteseq), which was developed based on the [Pseudo encrypt](https://wiki.postgresql.org/wiki/Pseudo_encrypt) function.  Daniel's README as well as the wiki article provide some good background on why and how to use it.

I'll share two examples where I used this in different scenarios.  The first case involves a model that will only ever grow slowly, likely never more than a thousand instances in the lifetime of the site.  But, we didn't want simple auto-incrementing integers representing the models in urls.  I mean I have to agree with my client, it just looks dumb.  Instead we decided on having a random 6-digit number, so that id 100000 might map to `544512` while id 100001 could be `174212`.  The original sequence would simply increment by one, but the output sequence would appear to be a totally random number staying within the same range.  Using the permuteseq extension we can accomplish this with a trigger as follows:

```sql
CREATE TABLE test1 (id INT NOT NULL);

CREATE SEQUENCE test1_id_seq AS int MINVALUE 100000 MAXVALUE 999999;
CREATE OR REPLACE FUNCTION test1_id() RETURNS trigger AS $$
    BEGIN
        NEW.id := permute_nextval('test1_id_seq'::regclass, 99094068::int);
        RETURN NEW;
    END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER test1_id BEFORE INSERT ON test1 FOR EACH ROW EXECUTE FUNCTION test1_id();

INSERT INTO test1 select generate_series(1, 10);

select * from test1;
   id
--------
 837440
 427209
 483450
 269287
 785371
 572951
 189424
 769220
 799370
 613481
(10 rows)
```

Note that we don't actually need to store the original sequence in the table, we can simply use the permuted value as the primary key.  If you create an index on it, it will function as well as if you'd defined the id as `SERIAL NOT NULL`.  If we for some reason need to get the original value for the id, we can call the `reverse_permute()` function using the same key.

Here's another interesting use case where I needed a much larger input space and also wanted to map the returned values into a compressed short code of 7 characters.  We use a 64-bit bigint and two functions that scramble and unscramble the permuted value into a base 32 alphabet.  The alphabet specifically excludes most vowels in order to reduce the occurrence of "bad words" that may appear in the output string.

```sql
CREATE TABLE test2 (id BIGINT, public_id TEXT);

CREATE OR REPLACE FUNCTION scram(n bigint) RETURNS text
    LANGUAGE plpgsql IMMUTABLE STRICT AS $$
DECLARE
    alphabet text := '0123456789bcdefghjklmnpqrstvwxyz';
    base int := length(alphabet);
    _n bigint := abs(n);
    output text := '';
BEGIN
    LOOP
        output := substr(alphabet, 1+(_n%base)::int, 1) || output;
        _n := _n / base;
        EXIT WHEN _n=0;
    END LOOP;
    RETURN output;
END $$
;

CREATE OR REPLACE FUNCTION unscram(s text) RETURNS bigint
    LANGUAGE plpgsql IMMUTABLE STRICT AS $$
DECLARE
    alphabet text := '0123456789bcdefghjklmnpqrstvwxyz';
    base int := length(alphabet);
    x bigint := 0;
    len int := length(s);
    c char;
    v bigint := 0;
    incr bigint := 0;
BEGIN
    FOR i IN REVERSE len-1..0 LOOP
        c := substring(s from len-i for 1);
        v := position(c in alphabet) - 1;
        incr := v * cast(base^i as bigint);
        x := x + incr;
    END LOOP;
    RETURN x;
END $$
;

CREATE SEQUENCE test2_id_seq AS bigint MINVALUE 1073741824 MAXVALUE 34359738367;
CREATE OR REPLACE FUNCTION test2_id() RETURNS trigger AS $$
    BEGIN
        NEW.id := permute_nextval('test2_id_seq'::regclass, 1201394821745067096::bigint);
        NEW.public_id := scram(NEW.id);
        RETURN NEW;
    END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER test2_id BEFORE INSERT ON test2 FOR EACH ROW EXECUTE FUNCTION test2_id();


INSERT INTO test2 select generate_series(1, 10);
select * from test2;
     id      | public_id
-------------+-----------
 17304775686 | h3q3v06
 29946703616 | vwgdvr0
 15266111233 | f6ywqr1
 14798935085 | es1cn1e
 24770579191 | q2722qq
 21937431444 | mes58wm
  4184274092 | 3wpex5d
 23704042525 | p2exz0x
  2499591869 | 2bgsgnx
 25282238517 | qjg0p1n
(10 rows)

```

The minvalue and maxvalue were chosen for the sequence to guarantee that in our base 32 alphabet we will always have exactly 7 characters in the output string. To recover the original id, unscramble `public_id` and pass that value to `reverse_permute()`.  To recover our first id:

```sql
select reverse_permute('test2_id_seq'::regclass, unscram('h3q3v06')::bigint, 1201394821745067096::bigint);
 reverse_permute
-----------------
      1073741824
```

You'll note that this matches the minvalue of the sequence.  You could choose to do the unscrambling either in the database or in the application since you could easily implement a similar function in your favorite programming language.  Also, there's no need to explicitly store the original id, since Postgres will simply maintain it in the sequence.  It's simply an auto-incrementing counter.  All you care about is that every time you insert, you will get a new and unique 7 character string.

As implemented, this provides enough space for more than 33 billion ids, all of them squeezed into the space of just 7 characters.  And if you want to apply the same scrambling function to another model in your database, simply use a different key as the second argument to `permute_nextval`.  Now you've got a completely different permutation that can operate on the same input values as the original sequence.

Permuteseq continues to be my personal favorite among all the different solutions to this problem.  However, it is a Postgres extension so not only do you need Postgres, you also need to setup the appropriate permissions to create extensions on your database server.


## Other ciphers

The flexibility of Feistel ciphers has to do with the ability to use an arbitrary block size, even those that would be too small for standard symmetric encryption algorithms.  The cycle-walking technique implemented in [permuteseq](https://github.com/dverite/permuteseq) ensures that the output range is always locked to the input range.

There are cases in which you may want to consider standard key encryption.  Personally I haven't delved into using these for encrypting database fields because I'm usually looking for a smaller range of input values, whereas key encryption is better suited to encryption of longer messages.  Still, you do have some good options if you want to explore this route.  

For a 32-bit range in Postgres, you could try [Skip32](https://wiki.postgresql.org/wiki/Skip32_(crypt_32_bits)).  This is a based on [Skipjack](https://en.wikipedia.org/wiki/Skipjack_(cipher)) but using a 32-bit key instead of 64.  I will not comment on how wise it is to think this constitutes good encryption.  In the 64-bit space the options start getting better and you could start with [XTEA](https://en.wikipedia.org/wiki/XTEA).  You might also get some [additional ideas here](https://gist.github.com/Kobold/999eba6b0d129a3994fc).  Note that technically both Skipjack and XTEA are in fact Feistel ciphers, but these specific implementations are formalized as standards and have thus been studied a bit more than some random code you happen to pull out of a wiki.  Again, I'm not going to venture any recommendations in this space because [YOU’RE STILL GONNA BE MOSSAD’ED UPON](https://www.usenix.org/system/files/1401_08-12_mickens.pdf).



## Random permutations

I want to wrap up by exploring the idea of a truly random permutation, which is completely unbreakable as long as your random number generator is good enough---and it's probably not.

I got this idea from Daniel Vérité in the README of [permuteseq](https://github.com/dverite/permuteseq).  In the Q & A, to address why you'd want to use permuteseq instead of a random shuffle, he answers:

> The permuter in this extension does not need to materialize the output sequence, even temporarily.
It computes any element independantly when needed, in near-constant time, so it's as efficient with 2^64 elements as with a thousand or a million.

Interesting, I get it, but in a sense we *are already materializing* the output sequence---it's represented by a row in our table after all.  Not the entire sequence, of course, which indeed is what you would need to do if you wanted to `ORDER BY random()`.  And as much as I'd like to see someone try to populate a table with 9 quintillion rows to generate a random ordering of bigints, perhaps we should try another approach.  How about using the Fisher-Yates shuffle?  Is there a way we can iteratively shuffle the ids such that the only state we need to rely on is the portion of ids that we've already materialized?

Indeed there is, and while this approach appears to be the same as another alternative that Vérité mentions---taking a new random number each time and looking up for collisions---it is actually much different and avoids the punishing cost of handling the increasing likelihood of collisions as you approach the end of the sequence.  In practice, however, especially if we're talking about bigints here, you're not going to come close to exhausting the sequence, but let's explore how these methods can actually be accomplished and what the space tradeoffs would look like.

What is the [Fisher-Yates](https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle) shuffle?  Or more technically, the Fisher-Yates-Durstenfeld-Knuth shuffle?  Simply, it is the optimal way to generate a random permutation of an input set such that all permutations are possible with exactly the same probability.  Jeff Atwood has a good discussion on why this algorithm [is so important](https://blog.codinghorror.com/the-danger-of-naivete/) and Mike Bostock has several [brilliant illustrations](https://bost.ocks.org/mike/shuffle/) that demonstrate why alternative methods perform poorly.  Pay close attention to the 2nd visualization which highlights in red the random numbers that have already been selected (i.e. collisions) and thus must be re-tried.  By maintaining a little bit of state alongside your already materialized records, you can efficiently do an iterative Fisher-Yates shuffle to permute the original sequence into a new random sequence.  Now, of course that "little bit of state" becomes impractical towards the 64-bit integer limit, but your database would have become impractical well before you reached that scale to begin with.

How does the Fisher-Yates shuffle work? To illustrate, let's run through the algorithm on a small set of just 8 integers:

<style>

table {
  border-collapse: collapse;
  border-spacing: 0;
  empty-cells: show;
  border: 1px solid #cbcbcb;
}

caption {
  color: #000;
  font: italic 85%/1 arial, sans-serif;
  padding: 1em 0;
  text-align: center;
}

td, th {
  border-left: 1px solid #cbcbcb;
  border-width: 0 0 0 1px;
  font-size: inherit;
  margin: 0;
  overflow: visible;
  padding: 0.5em 1em;
  border-width: 0 0 1px 0;
  border-bottom: 1px solid #cbcbcb;
  text-align: center;
  width: 1em;
}

thead {
  background-color: #e0e0e0;
  color: #000;
  text-align: left;
  vertical-align: bottom;
}

tbody > tr:last-child > td {
    border-bottom-width: 0;
}

.shaded {
  background-color: #e0e0e0;
}

.cards {
  display: grid;
  grid-template-columns: repeat(8, 2em);
  grid-auto-rows: auto;
  grid-gap: 0.5em;
}

.card {
  border: 1px dotted blue;
  padding: .5em;
  display: flex;
  align-items: center;
  justify-content: center;
}

.swapped {
  background-color: lightcyan;
}

.active {
  background-color: yellow;
}

.fixed {
  background-color: #cbcbcb;
}
</style>

<div class="cards">
  <div class="card">1</div>
  <div class="card">2</div>
  <div class="card">3</div>
  <div class="card">4</div>
  <div class="card">5</div>
  <div class="card">6</div>
  <div class="card">7</div>
  <div class="card">8</div>
</div>
<br />



In the first step, we choose a random number between 1 and 8, let's say it's 6, so then we swap the 1^st^ index with the 6^th^ index.  In the second step, we choose a random number between 2 and 8, and let's say that's 3.  So we would swap the 2^nd^ index with the 3^rd^.  To visualize how this work, the table below demonstrates one possible shuffle.  For each step, the current index is highlighted in yellow and in the output sequence, the cyan shading highlights the indexes that were swapped in that step.  Array elements with a gray background have already been selected and are now part of the final sequence.

<table>
<thead>
<tr>
<th>Step</th>
<th>Input sequence</th>
<th>Range</th>
<th>Rand</th>
<th>Output sequence</th>
</tr>
</thead>
<tbody>
<tr>
<td>1</td>
<td>
<div class="cards">
<div class="card active">1</div>
<div class="card">2</div>
<div class="card">3</div>
<div class="card">4</div>
<div class="card">5</div>
<div class="card">6</div>
<div class="card">7</div>
<div class="card">8</div>
</div>
</td>
<td>1-8</td>
<td>6</td>
<td>
<div class="cards">
<div class="card swapped">6</div>
<div class="card">2</div>
<div class="card">3</div>
<div class="card">4</div>
<div class="card">5</div>
<div class="card swapped">1</div>
<div class="card">7</div>
<div class="card">8</div>
</div>
</td>
</tr>
<tr>
<td>2</td>
<td>
<div class="cards">
<div class="card fixed">6</div>
<div class="card active">2</div>
<div class="card">3</div>
<div class="card">4</div>
<div class="card">5</div>
<div class="card">1</div>
<div class="card">7</div>
<div class="card">8</div>
</div>
</td>
<td>2-8</td>
<td>3</td>
<td>
<div class="cards">
<div class="card fixed">6</div>
<div class="card swapped">3</div>
<div class="card swapped">2</div>
<div class="card">4</div>
<div class="card">5</div>
<div class="card">1</div>
<div class="card">7</div>
<div class="card">8</div>
</div>
</td>
</tr>
<tr>
<td>3</td>
<td>
<div class="cards">
<div class="card fixed">6</div>
<div class="card fixed">3</div>
<div class="card active">2</div>
<div class="card">4</div>
<div class="card">5</div>
<div class="card">1</div>
<div class="card">7</div>
<div class="card">8</div>
</div>
</td>
<td>3-8</td>
<td>6</td>
<td>
<div class="cards">
<div class="card fixed">6</div>
<div class="card fixed">3</div>
<div class="card swapped">1</div>
<div class="card">4</div>
<div class="card">5</div>
<div class="card swapped">2</div>
<div class="card">7</div>
<div class="card">8</div>
</div>
</td>
</tr>
<tr>
<td>4</td>
<td>
<div class="cards">
<div class="card fixed">6</div>
<div class="card fixed">3</div>
<div class="card fixed">1</div>
<div class="card active">4</div>
<div class="card">5</div>
<div class="card">2</div>
<div class="card">7</div>
<div class="card">8</div>
</div>
</td>
<td>4-8</td>
<td>4</td>
<td>
<div class="cards">
<div class="card fixed">6</div>
<div class="card fixed">3</div>
<div class="card fixed">1</div>
<div class="card swapped">4</div>
<div class="card">5</div>
<div class="card">2</div>
<div class="card">7</div>
<div class="card">8</div>
</div>
</td>
</tr>
<tr>
<td>5</td>
<td>
<div class="cards">
<div class="card fixed">6</div>
<div class="card fixed">3</div>
<div class="card fixed">1</div>
<div class="card fixed">4</div>
<div class="card active">5</div>
<div class="card">2</div>
<div class="card">7</div>
<div class="card">8</div>
</div>
</td>
<td>5-8</td>
<td>6</td>
<td>
<div class="cards">
<div class="card fixed">6</div>
<div class="card fixed">3</div>
<div class="card fixed">1</div>
<div class="card fixed">4</div>
<div class="card swapped">2</div>
<div class="card swapped">5</div>
<div class="card">7</div>
<div class="card">8</div>
</div>
</td>
</tr>
<tr>
<td>6</td>
<td>
<div class="cards">
<div class="card fixed">6</div>
<div class="card fixed">3</div>
<div class="card fixed">1</div>
<div class="card fixed">4</div>
<div class="card fixed">2</div>
<div class="card active">5</div>
<div class="card">7</div>
<div class="card">8</div>
</div>
</td>
<td>6-8</td>
<td>7</td>
<td>
<div class="cards">
<div class="card fixed">6</div>
<div class="card fixed">3</div>
<div class="card fixed">1</div>
<div class="card fixed">4</div>
<div class="card fixed">2</div>
<div class="card swapped">7</div>
<div class="card swapped">5</div>
<div class="card">8</div>
</div>
</td>
</tr>
<tr>
<td>7</td>
<td>
<div class="cards">
<div class="card fixed">6</div>
<div class="card fixed">3</div>
<div class="card fixed">1</div>
<div class="card fixed">4</div>
<div class="card fixed">2</div>
<div class="card fixed">7</div>
<div class="card active">5</div>
<div class="card">8</div>
</div>
</td>
<td>7-8</td>
<td>8</td>
<td>
<div class="cards">
<div class="card fixed">6</div>
<div class="card fixed">3</div>
<div class="card fixed">1</div>
<div class="card fixed">4</div>
<div class="card fixed">2</div>
<div class="card fixed">7</div>
<div class="card swapped">8</div>
<div class="card swapped">5</div>
</div>
</td>
</tr>
<tr>
<td>8</td>
<td>
<div class="cards">
<div class="card fixed">6</div>
<div class="card fixed">3</div>
<div class="card fixed">1</div>
<div class="card fixed">4</div>
<div class="card fixed">2</div>
<div class="card fixed">7</div>
<div class="card fixed">8</div>
<div class="card active">5</div>
</div>
</td>
<td>8-8</td>
<td>8</td>
<td>
<div class="cards">
<div class="card fixed">6</div>
<div class="card fixed">3</div>
<div class="card fixed">1</div>
<div class="card fixed">4</div>
<div class="card fixed">2</div>
<div class="card fixed">7</div>
<div class="card fixed">8</div>
<div class="card fixed">5</div>
</div>
</td>
</tr>
</tbody>
</table>

<br />
You can see from the decreasing random number range at each step that we will end up with one of the 8! possible permutations of the original sequence.  Now, let's walk through this again with the assumption that we can store the output sequence at each step---either in a database table or a Python dict or a Javascript Map---as if we were creating new objects only when needed.  What information would we need to store alongside the output sequence in order to maintain the current state of the shuffle at each step?

For example, after the first object is assigned id 6, we need to maintain a pointer from 6 back to 1, to indicate that we've swapped these values.  When we roll a 6 again in Step 3, we have to update that pointer again.  So, in addition to the output sequence generated thus far, we will need to maintain a map of pointers for each index that has been swapped from its original value but hasn't yet been selected for the output sequence.  In a database, we can do this by maintaining a lookup table.  In Javascript or Python, we can maintain a Map or dict and delete the entries once they are no longer needed as the mapped values become part of the output sequence.


### Proof of concept

I created a small proof of concept (or proof of correctness?) to demonstrate how to do this [iterative Fisher-Yates shuffling](https://gist.github.com/czep/560e4cb181342eec7281210ad2aeac44).  The script will pre-generate all 8! permutations and compare the results from using the iterative shuffling method to those from the in-place shuffle.  Using 1-based arrays to simplify the notation, here is what the Javascript implementation looks like:

```javascript
let i;
let ptr = new Map();
let res = [0];

for (i = 1; i < this.n ; i++) {
  const r = // get a random integer between i and n, inclusive

  // determine which value to move to the output sequence
  if (ptr.has(r)) {
    res.push(ptr.get(r));
  }
  else {
    res.push(r);
  }

  // update the map of pointers to swapped values
  if (ptr.has(i)) {
    ptr.set(r, ptr.get(i));
    ptr.delete(i);
  }
  else {
    if (r > i) {
      ptr.set(r, i);
    }
  }
}

// finalize for i == n
if (ptr.has(i)) {
  res.push(ptr.get(i));
  ptr.delete(i);
}
else {
  res.push(i);
}

```

See the script in the gist linked above for more details.  Of course, you don't want to do this iteratively without persisting the data structures because if the server shuts down your sequence will be destroyed.  So chances are you probably want to do this in the database anyway.  In SQL we can accomplish the same thing but with the added caveat that we will need to persist the map to a lookup table to store the swap pointers.  Later we'll evaluate how much of a big deal this might be, but for now, here's what we need to do to get a POC working in Postgres.


```sql

DROP TABLE IF EXISTS fymodel CASCADE;
DROP TABLE IF EXISTS fymap CASCADE;

CREATE TABLE fymodel (
    id SERIAL PRIMARY KEY,
    rand INT,   -- keeping this is not necessary, but is useful for debugging
    public_id INT UNIQUE
);

CREATE TABLE fymap (
    k INT UNIQUE NOT NULL,
    v INT
);

CREATE OR REPLACE FUNCTION fy_id() RETURNS trigger
    LANGUAGE plpgsql VOLATILE STRICT AS $$
DECLARE
    r INT;
    ptr_r INT;
    ptr_i INT;
BEGIN
    -- change the min and max values to match your sequence
    SELECT getrand(NEW.id::INT, 1000::INT) into r;

    -- determine which value to move to the output sequence
    SELECT v into ptr_r FROM fymap WHERE k = r;
    IF FOUND THEN
        NEW.public_id = ptr_r;
    ELSE
        NEW.public_id = r;
    END IF;

    -- update the lookup table of swapped values
    SELECT v into ptr_i FROM fymap WHERE k = NEW.id;
    IF FOUND THEN
        INSERT INTO fymap (k, v) VALUES (r, ptr_i)
            ON CONFLICT (k) DO UPDATE SET v = EXCLUDED.v;
        DELETE FROM fymap WHERE k = NEW.id;
    ELSE
        IF r > NEW.id THEN
            INSERT INTO fymap (k, v) VALUES (r, NEW.id)
                ON CONFLICT (k) DO UPDATE SET v = EXCLUDED.v;
        END IF;
    END IF;
    NEW.rand = r;
    RETURN NEW;
END $$
;
CREATE TRIGGER fy_id BEFORE INSERT ON fymodel FOR EACH ROW EXECUTE FUNCTION fy_id();


CREATE OR REPLACE FUNCTION getrand(min INT, max INT) RETURNS INT
    LANGUAGE plpgsql VOLATILE STRICT AS $$
BEGIN
    -- Remember, `random` is a simple LCG
    -- Do you want to use pgcrypto instead?
    RETURN floor(random() * (1 + (max - min)) + min);
END $$
;

insert into fymodel select from generate_series(1,1000);

```


### Analysis

So how different would this method be in practice to the much simpler one of choosing numbers fully at random each time and doing a lookup for collisions?  I'll consider a range of scenarios to help evaluate when you might want to use the FY shuffle and when you might as well fallback to collision lookup.  Keep in mind that collisions will only become likely if we've already exhausted a substantial portion of the available range.  I can already tell you without doing the math that if you want to permute the full range of a bigint, you might as well take a new random number every time.  You'll still have to lookup for collisions---bigints aren't GUIDs---but even a billion ids is just a small small fraction of the range of a bigint.

However, if you're looking into this to obfuscate ids, chances are you aren't interested in permuting the full range of bigint.  For example, if you want to assign these to userids, you might have `/users/4/` alongside `/users/3232592451330965504`.  It's likely more typical that we'd use this on a much tighter range, so that we could use something like the `scram` function I defined earlier to transform the number into an alphabet that would have the same length over the full range of ids.

Coincidentally, as I was writing up this section I came across this paper, [Simple, Optimal Algorithms for Random Sampling Without Replacement](https://arxiv.org/pdf/2104.05091.pdf) submitted to arxiv just last month.  My Javascript and Postgres implementations are pretty much the same as what the author refers to as the "Sparse Fisher-Yates sampler" shown in Algorithm 2.  When choosing k elements from a range of n, this algorithm has time complexity of O(k), uses space of O(k(1-k/n)), and uses k random draws.  Table 2 shows an interesting comparison of the different algorithms the author considered.

I find Algorithm 4 "Pre-initialized Fisher-Yates with undo" interesting because it advertises only O(1) space.  In this algorithm, instead of managing a lookup table, you simply "unwind" the swaps to obtain the output sequence.  However, as noted in the paper, you still need to store the output sequence and the random draw from each step.  We could do this in Postgres without the lookup table as long as we store the input id, the random number r, and the output id.  However, iterating through the unwinds would take a lot of windowing magic.

Anyway, back to our use cases.  Consider the case where we want a sequence of 6 digits, from `100000` to `999999`.  If we expect to use 1,000 ids, the expected number of collisions we would observe by choosing a random number each time is just 1.11 ([derivation](https://math.stackexchange.com/questions/35791/birthday-problem-expected-number-of-collisions/35798#35798); [calculation](https://www.wolframalpha.com/input/?i=1000+*+%281-%281-1%2F900000%29%5E%281000-1%29%29)).  If we reach 10% of the range, k = 90,000, then we'd encounter roughly 8,564 collisions, so that's roughly a 10% chance of finding a collision and having to get a new random number.  Is this extra work worse than the storage cost of the lookup table?  At k = 1,000, the expected number of rows in the lookup table is 998.89.  Early in the sequence, almost all of the random numbers we choose will not have been observed yet so most of them get swapped into the lookup table.  By k = 90,000, our lookup table will have about 81,000 rows---the missing 9,000 will be the residue of collisions that have been swapped back into the output sequence.

In either case, at this small scale it probably doesn't matter which method you choose.  Arguably, the collision lookup would be the simpler case to implement.  But as you start exhausting a substantial portion of the range, this method will very quickly grow infeasible as the probability of collision approaches 1.

Now, for the second use case where we have a range of 33,285,996,544 bigints chosen to map to a base-32 alphabet such that all the numbers in the range will have exactly 7 characters.  The following table summarizes the time-space trade-offs between doing a re-sample on collision detection vs an iterative Fisher-Yates permutation:

% of range               k     Collisions   Lookup table size
----------  --------------  -------------  ------------------
      0.1%      33,285,997         33,269          33,252,711
        1%     332,859,965      3,312,011         329,531,366
       10%   3,328,599,654    316,757,850       2,995,739,689
----------  --------------  -------------  ------------------


<br />
Reaching 0.1% of the available key space---33M ids---you will have encountered 33k collisions if using a new random number each time.  On the other hand, using the iterative Fisher-Yates shuffle you would be storing almost all of those random numbers in a separate lookup table.  With such a large range, the chance of a collision is so small that handling duplicates as they arise is almost guaranteed to be better than maintaining a complicated shuffling process with its own lookup table.

In summary, the iterative Fisher-Yates shuffle can deliver a random permutation and when combined with a [cryptographically secure random number generator](https://en.wikipedia.org/wiki/Cryptographically-secure_pseudorandom_number_generator) it would provide you with a random sequence that would not leak any information about the volume or rate of creation of the underlying objects.  For pre-generating ids over a large fraction of an input range, it would definitely be more efficient than collision lookup as the probability of collision increases.  However, it's complicated to implement correctly and if you lose state at any time during sequence generation, your permutation will be lost as well.

From `/users/0cc331b8-e83d-41b4-b9c1-9cbc2d06c929`, I bid you good luck in obfuscating your ids!

