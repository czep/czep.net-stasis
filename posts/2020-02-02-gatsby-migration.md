---
layout: post
title: Migrating to Gatsby
date: 2020-02-02
topics: web
---

I have just completed a migration of this blog from Jekyll to Gatsby.  Along the way I've learned a little bit more about React and Node while taking my blog out of the flat static and Bootstrap era and into the over-engineered modern Javascript era.  I still have much to learn, and I still need to re-style the site, but at least now I have a workflow that actually works.  In this post I'll discuss how I decided on Gatsby and a few of the specifics I encountered during the migration.

<!--excerpt-->

I have just completed a migration of this blog from [Jekyll](https://jekyllrb.com/) to [Gatsby](https://www.gatsbyjs.org/).  Along the way I've learned a little bit more about React and Node while taking my blog out of the flat static and Bootstrap era and into the over-engineered modern Javascript era.  I still have much to learn, and I still need to re-style the site, but at least now I have a workflow that actually works.  In this post I'll discuss how I decided on Gatsby and a few of the specifics I encountered during the migration.

The source code for this blog is now available in Github in the repository [czep.net-gatsby](https://github.com/czep/czep.net-gatsby).  Not that I'd expect anyone to learn anything serious from it, but hey there it is.

## How I gave up on Jekyll

The most ancient posts on this site date back to my Wordpress days.  I moved to Jekyll in 2015 because it offered both an easy workflow for developing and publishing posts in my local text editor and it built nice tight static html files that could be deployed anywhere.  S3 and Cloudfront were the obvious choice for me because I already had a lot invested in the AWS ecosystem and knew the deployment process very well.  This year, after more than two years of inactivity due to the rapid disappearance of my free time, I finally found something to say again and so I dusted off the virtual cobwebs of my blog's source code and prepared a new post.  That's when I ran into some road blocks.

The first issue was that Jekyll itself had advanced to a new major version which brought along a few breaking changes that I had to address.  Of course, I don't fault Jekyll for this because the new changes in version 4 are actually welcome improvements.  However, I don't use Ruby for anything else at all, so updating and maintaining a full Ruby development environment simply to build my blog is a bit of a tangential hassle.  In any case, it wasn't too much work and I was able to make the necessary changes to my code and template syntax in order to make the build work.  The real blocker happened when I went to deploy and found that my deployment package was no longer maintained.

The package [s3_website](https://github.com/laurilehmijoki/s3_website) is pretty much the only option for deploying a Jekyll site to S3. It's the only one listed in the Jekyll docs [on deployment](https://jekyllrb.com/docs/deployment/manual/) and searching for alternatives turns up a great deal of abandonware and incomplete projects with not nearly the same level of features.  It also worked very well, especially with the `ignore_on_server` and `exclude_from_upload` configuration options which allowed my blog to happily coexist with the myriad of legacy junk I still keep around on my site.  Alas, the maintainer had to step away from the project and in the past year it has seen no new development.  Since s3\_website is partially written in Scala, it depends on Java, which like Ruby is another environment I never use for anything else besides my blog.  Unfortunately, the old versions of Java that s3\_website is compiled against will not work with the current runtimes.

This is discussed in several issues in Github, and I attempted a few workarounds suggested there that might get the project to build but with no success.  I was then faced with either diving into the source and working in a stack in which I have little experience and no other use, or to find another alternative.  This was the last straw.  If it was just Ruby, fine I could deal with that.  But adding to that the hell that is Java---Oracle Java---and the numerous problems I've had getting JDKs and JREs to work on OSX over the past 5 years, it all seemed like a complete waste of time.

So here I was with a new post that I had just finished and really wanted to get up on my blog.  All the static files were built and ready to go but I just had to upload them to S3.  I briefly considered uploading them all manually using the AWS console, but c'mon, that's just not going to be a good long-term solution.  And besides, it had been more than 5 years since I investigated the alternatives so perhaps this was the right tipping point to find a better way.

## How I landed on Gatsby

Since there are static site generators in just about every programming language imaginable, one may as well choose based first on whichever stack you wish to work.  If you want python, there's [pelican](https://blog.getpelican.com/) and [hyde](https://hyde.github.io/).  [Jekyll](https://jekyllrb.com/) of course, for Ruby.  If you like, or want to learn Go, [Hugo](https://gohugo.io/) is gaining a lot of popularity as well.  I've used [blogdown](https://bookdown.org/yihui/blogdown/), based on R and RMarkdown (and using Hugo under the hood), for several recent projects and having also been doing a lot of R web programming lately, this was for me the most serious contender in my survey of Jekyll replacements.  But I decided to take a risky bet well outside my comfort zone to learn Gatsby which is based on [React](https://reactjs.org/).

I started working a little bit seriously with React last year in part owing to my quest to not be so entirely pigeonholed as a back-ender.  For a data scientist, the bar for what constitutes decent Javascript is generally low enough that even I can slide underneath it somewhat gracefully.  A better motivation is to say that someone with data science domain knowledge can bring an awful lot to the table with just a little bit of front-end added to the toolkit.  I'll discuss this particular thread in upcoming posts, but for now suffice to say that I wanted more exposure to React and this really was the primary reason I decided to give Gatsby a shot.

## How Gatsby works

The first step is to understand what Gatsby is and how it works in a general sense.  Before even starting, realize that Gatsby is based on React so if you are not at all familiar with React it will be helpful to acquire a basic level of familiarity by going through the React docs and following some tutorials.  Secondly, Gatsby is a node application, so even if you have worked with React in a browser before, there are some subtleties about how node works that may cause confusion.  However, all this being said, you most certainly do not need to be an expert in React before you can build a basic blog with Gatsby.  All you really need to understand is how Gatsby drives templates with source components and passes data to those components using [GraphQL](https://graphql.org/).

Here is a basic introduction to how Gatsby works.  "Data", including markdown posts and site metadata, is queried using GraphQL.  That data is then passed as props to a React component defined in a template or in a source component.  Much of the functionality is provided by plugins which are configured in `gatsby-config.js`.  The configuration is very lightweight: you install a package with npm, add it to the plugins array, and provide some options which are usually well documented and mainly involve pointing to appropriate directories in your source tree.  The core work that Gatsby does is defined in `gatsby-node.js`, where you will define the `createPages` function to build your actual site.  For example, to loop over markdown posts, first define a GraphQL query to supply the data for each post.  Then you will call `createPage` and pass the data as props to a template defined in `src/templates`.  The templates directory contains React components for each type of page you wish to create:  blog posts, index, category pages, flat pages, etc.  Within each template component, you can refer to other React components defined in `src/components` for common functionality such as layout, header, sidebar, footer, and author bio.  Once you have a grasp of the basic data flow pattern in Gatsby---from raw source files that are transformed to data accessed with GraphQL then handed off to React components for rendering---you will find it to be a very logical and clean structure for building your site.

There are several good resources on how to get started with Gatsby and also specifically how to migrate from Jekyll.

* [The official Gatsby Docs](https://www.gatsbyjs.org/docs/)
* [How I migrated my site from Jekyll to Gatsby](https://www.acuriousanimal.com/blog/2019/10/03/from-jekyll-to-gatsby)
* [From Jekyll to Gatsby - a Blog Migration](https://brandonlehr.com/gatsby/jekyll/2018/12/22/from-jekyll-to-gatsby)
* [Migrating from Jekyll to Gatsby](https://tjaddison.com/blog/2019/09/migrating-from-jekyll-to-gatsby/)



## Some particulars of the migration

The migration from Jekyll to Gatsby was not particularly onerous and I encountered what I would consider an expected level of frustration that would be concomitant with moving to any new platform.  Even though Gatsby offers several modern methods for styling your site, I chose the path of least effort: simply maintaining my existing styles as a static file and referencing them with `className` attributes.  I decided to take this route first so that I could focus on the structure of Gatsby without getting distracted by the possibilities of a complete redesign.  The drawback of course is that I am still stuck with the styling that I build 5-ish years ago based on Bootstrap 3 dot something.  But I'm glad I approached it this way because I had a very clear end goal to aim for:  simple reproduction of my existing layout and styles.  When time permits and I'm finally thoroughly nauseated by my site's rather lackluster appearance, I will take the time to investigate some of the more modern approaches to styling that Gatsby enables.  This includes using [Modular stylesheets](https://www.gatsbyjs.org/docs/css-modules) or [CSS-in-JS](https://www.gatsbyjs.org/docs/css-in-js/) solutions, both of which are well documented in the referened links.

Apart from styling, the main issues and customizations I had to make included handling of syntax highlighting, the path or slug definition for each post, category views ('topics' on my site), and how to handle legacy pages.

### Syntax highlighting

Moving from Jekyll there were a few differences in Markdown syntax that I had to manually fix.  For example, syntax highlighting in Jekyll's liquid templates use blocks marked with, for example, `{% highlight python %}` ... `{% endhighlight %}` whereas in Gatsby [primsjs](https://prismjs.com/) expects code blocks demarcated with backticks as in ` ```python  ` and closed with ` ``` `.  Since I have a lot of syntax examples in my blog posts, I used `sed`[^1] to replace Jekyll's syntax with that expected by Gatsby:

```bash
find posts/ -type f -name '*.md' | xargs sed -i '' -E 's/{% highlight ([[:alnum:]]+)[[:space:]]%}/```\1/g'
find posts/ -type f -name '*.md' | xargs sed -i '' -E 's/{% endhighlight %}/```/g'
```

If you only have a few posts it might be simpler to do a `grep '{% highlight' posts/*.md` and make the adjustments manually.

### Slugs

If you are coming from Jekyll, you will be used to having a `posts` folder with the naming convention of `/YYYY-MM-DD/slug.md`.  In Gatsby you are free to organize your blog posts however you wish, but in order to do so, you need to specify the construction of the path for each blog post in the `onCreateNode` function defined in `gatsby-node.js`.  On my blog I like to organize the posts based on two digit year followed by the slug with the file ending in `.html`, as in: `/YY/slug.html`.  This can be accomplished with a little bit of wrangling of the file path:


```javascriptreact
exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions;

  if (node.internal.type === `MarkdownRemark`) {
    const filename = createFilePath({ node, getNode });

    if (node.frontmatter.layout === 'post') {

      const [, postDate, postSlug] = filename.match(
        /^\/([\d]{4}-[\d]{2}-[\d]{2})-{1}(.+)\/$/
      );
      const postYear = postDate.substring(2, 4);
      const slug = `/${postYear}/${postSlug}.html`;

      createNodeField({
        name: `slug`,
        node,
        value: slug,
      })
    }
  }
}
```

### Topic pages

In the front-matter of each blog post in Markdown, I include a `topics` field which maps the post to one or more topics (categories) such as [data](https://czep.net/topics/data), [web](https://czep.net/topics/web), [culture](https://czep.net/topics/culture), etc.  In Jekyll I used the categories plugin to handle building the list pages for each of these topics.  Moving to Gatsby I had to write this myself. It was not a difficult procedure but there were a few tricks I had to use to get things working exactly the way I wanted.

Starting with the GraphQL query in `gatsby-node.js` which supplies all the data needed in that function to process the Markdown blog posts:

```javascriptreact
  const query = await graphql(`
    query {
      blogPosts: allMarkdownRemark(
        filter: {frontmatter: {layout: {eq: "post"}}}
        sort: { fields: [frontmatter___date], order: DESC }
      ) {
        edges {
          node {
            fields {
              slug
            }
            frontmatter {
              layout
              path
              date
              title
              topics
            }
            excerpt
          }
        }
      }
    }
  `);
```

To build my topic pages I can re-use the same part of the GraphQL query used to process each post by extracting the topics field from the frontmatter of each post.  However, since I allow for assigning a post to multiple topics, eg. `topics: data statistics`, I can't simply create a unique `Set` of the raw topics extracted in this way.  My solution is to first extract the `rawTopics`, then map each to an `allTopics` array which splits on spaces.  Finally, use the ES6 `flat()` Array method to collapse the `allTopics` 'array of arrays' into a single flattened array.  The flattened array I can then pass to a `tabulate` function which returns the topic name and the count of posts that belong to it.  This gives me all the data necessary to call `createPage` with the path, component, and context for each topic:

```javascriptreact
  const blogPosts = query.data.blogPosts.edges;

  let rawTopics = [];
  blogPosts.map(p => rawTopics = [...rawTopics, p.node.frontmatter.topics]);
  let allTopics = [];
  rawTopics.map(t => allTopics = [...allTopics, t.split(" ")]);
  const topicCounts = tabulate(allTopics.flat());

  [...topicCounts].map(([topic, postCount]) => {
    createPage({
      path: `/topics/${topic}/`,
      component: topicTemplate,
      context: {
        topicRegex: `/${topic}/`,
        topic: `${topic}`
      }
    });
  });
```

Since I also need to tabulate the topic counts in my sidebar component, I created `src/utils/tabulate.js` so I can call this both from the component and from
`gatsby-node.js`.

```javascriptreact
  // src/utils/tabulate.js

  const tabulate = function (x) {
    let tab = new Map();
    x.forEach(item => {
      if (tab.get(item)) {
        tab.set(item, 1 + tab.get(item));
      } else {
        tab.set(item, 1);
      }
    });
    return tab;
  };

  module.exports.tabulate = tabulate;
```

The template for building each topic page, `src/templates/topic.js` loops through each blog post to build a list of only those posts that contain that topic in its frontmatter.  Notice I am including both `topicRegex` and `topic` in the context when calling `createPage`.  The reason for this is because there is no `in` operator in the GraphQL filters available to Gatsby.  I can't use `eq` because if the post contains multiple space-separated topics, a simple `eq` will not include it in the filter results.  The only way is to use the `regex` filter operator where the regex can do string matching on the name of the topic.

```javascriptreact
export const topicQuery = graphql`
  query($topicRegex: String!) {
    allMarkdownRemark(
      filter: {
        frontmatter: {
          layout: {eq: "post"},
          topics: {regex: $topicRegex }
        }
      }
      sort: { fields: [frontmatter___date], order: DESC }
    ) {
    ...
  }
`;
```


## Static Website Hosting on S3 with Cloudfront

When I finally had Gatsby straightened out and was all set to deploy, I first gave [Netlify](https://www.netlify.com/) a try.  It was super easy to setup---create a Netlify account linked to Github, click a few buttons to trigger a build after deploying to the blog's repository, and everything happened like magic.  No messy manual uploading required.  The only issue that came up was that Netlify's Docker images use an older version of node by default, one which doesn't like the `Array.prototype.flat()` method so it was throwing errors until I fixed it by specifying a more recent node version to use when creating the build:

```bash
echo '13.7.0' > .nvmrc
```

However, I decided to roll back to S3 after a bit of contemplation.  The first thing I was a little leery about was having to move my domain's nameservers away from AWS and into Netlify in order for domain aliasing to work.  I had assumed I could simply point an A record from Route 53 to the custom domain name that Netlify created for my site.  Unfortunately, I discovered that Route 53 won't let you do that.  You can point to an IP address, an S3 bucket, or a Cloudfront distribution, but you can't point to an FQDN hosted outside of the AWS complex.  Netlify gives you the option of aliasing to the IP address of their load balancer, but this will prevent your site from being distributed on their CDN.  Since I was already on Cloudfront, this seemed like quite a step down, so I went ahead and transferred all the DNS records.  This left me a little uncomfortable, not because of the fear that Netlify will disappear overnight, but that I then had so many services in their hands while the rest of my infra remained housed in AWS.

But it was damn convenient so I went for it.  The next disappointment came a few days later when I clicked on the "Analytics" tab on my Netlify dashboard only to realize that I had somehow missed the fine print that access to your site logs would cost you $9/month.  I mean yeah, they gotta make money somehow, and their charts do look realllllly sweet, but that's well outside my blog budget.  My S3 bill only once crossed $5 and that was when I hit HN's front page twice.

So this meant going back to the docs to figure out how to get Gatsby to deploy onto S3 and play nice with Cloudfront.  It was just 2 hours of additional work, but now I have my DNS records back where they belong.  I really like and would still recommend Netlify, and I will definitely consider it for spinning off side projects, but I'll keep the blog on home turf for awhile longer.


## The Good

As I hinted earlier, the real reason I chose Gatsby was to get some more practice with React.  I ended up learning more about node than React, but I would still call that a win.  As a certified back-ender, whose primary occupation has me stuck in SQL most of the day, but having always admired front-end work and marvelling at the momentous evolution of the Javascript ecosystem, I am driven to learn it and excited about what I will be able to build by becoming more capable with front-end tools and tech.

Gatsby advertises itself as blazing fast and from a user experience perspective my Gatsby blog is now far more slick than it was when it was just flat static html.  Now all the shared components on the site---header, sidebar, footer---are not re-rendered on each page view since React components are now in control of smartly updating the DOM.  This makes navigation on my site much more fluid than before.  It's indeed very slick.

Using GraphQL to push data to components is a very powerful feature.  The Gatsby team has done a fantastic job integrating GraphQL and working with it within Gatsby is a tremendous timesaver and a much more scalable pattern than simply piping text into a parameterized template.

In general, the freedom to decompose your site into isolated chunks of functionality makes Gatsby a very extensible platform on which to build even highly complex sites.

Deploy is pretty simple too, using an npm script defined in `package.json`, a simple `npm run deploy` will load environment variables, deploy the public directory to
S3, and initiate a Cloudfront invalidation to remove stale pages from the edge caches.

## The Bad

It took a lot of head-shaking for me to get past the fact that the html files on my site are now a jumbled mess of cryptic javascript sources.  My Jekyll templates were setup so that the generated html was perfectly formatted.  That way, the 1 in 100,000 who decide to View-source will actually be able to read it.  But now the site is not human readable at all, I don't even have an idea what some of these tags do!  And there are divs thrown in that I didn't even put there.  But hey this is the way the web works nowadays.  20 years ago if you liked a website, you'd view source to figure out how they made it work.  Today, just go to their github!

One common criticism that always rears its head is the fact that introducing React means you now have 100-200 KB of JS to serve up before users can see your content.  It's kind of silly to complain about this when most sites have a multi-megabyte hero image at the top of each page.  In my case I don't have many images, so a 200KB hit is substantial if the content is just 20KB.  However, looking closer, because React is handling navigation, clicking on another page merely fetches the json to populate it.  Meanwhile, the header, sidebar, footer, etc. only have to be read once.  With truly static html, all of that is hard-coded into each page, so after hitting 3 or 4 pages, the extra cost of the Javascript bundle already makes up for itself.  I haven't done any real testing to prove that out, but I'll let you know after I get my next AWS bill!

There are still some rough edges in Gatsby, for example excerpt handling has had a bit of trouble.  But the project is so actively maintained, and the quibbles I run up against are so minor compared to what is provided out of the box.  If anything, Gatsby is way over-engineered if you are simply looking for a static site generator.  There's so much more to it than that and if you are curious, want to build towards the future, or just want to try out life on the bleeding edge, then it's definitely worth a go.

I still miss the `ignore_on_server` and `exclude_from_upload` features of s3\_website.  Gatsby's S3 plugin simply wipes your bucket and uploads the public directory on each deploy.  You can tell it not to delete files, but then it won't delete anything, so all the old content-hashed files will stay there until you manually delete them.

## What's next for the blog

A few days after wrapping this up, I read a [funny post on Dev.to](https://dev.to/thegreengreek/how-to-build-a-website-in-2020-4f0m) that mentioned [Eleventy](https://www.11ty.dev/).  I checked it out and now I'm a bit regretful that I didn't find out about it earlier.

The main thing this blog needs is some better styling!  I intentionally avoided the temptation to update the CSS to keep my focus, but of course this means I'm stuck with what I messed around with 5 years ago.

And yes I need a working [contact](https://czep.net/contact/) page.  Or do I?

Finally, ere yllaniF, Happy Palindrome Day!  I referenced this specific date in my post from 2011-11-02.  I was always wondering what I'd be doing on the next Palindrome day.  I'm not sure writing this post was the best way to spend it, but so be it.  At least there is another one right around the corner.  See you on 2021-12-02.


[^1]: BSD sed, not GNU sed, because I'm using OSX. The differences are frustrating enough that I had to call this out.






