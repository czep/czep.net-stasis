---
layout: post
title: Blog workflow - jekyll, s3, bootstrap
date: 2015-03-28
topics: web
---

In this post I will describe the workflow I used to generate this blog.

<!--excerpt-->

Front-end web development has always been an interest of mine ever since the early days of Netscape Navigator, Spyglass Mosaic, and lynx.  To a fledgling writer in 1994, the appeal of self-publishing which the world wide web engendered was undeniably compelling.  But those early days were wild indeed.  Geocities, AOL, blink tags, animated "Under Construction" gifs, crumpled paper backgrounds, 640x480 16-bit VGA displays, and the use of deeply nested \<table\> tags and spacer pixels for site layouts.

When [Jeffrey Zeldman](http://www.zeldman.com/) first published [Designing with Web Standards](http://en.wikipedia.org/wiki/Designing_with_Web_Standards) in 2003, web development was in the midst of a massive crisis.  Rapid adoption of the web, fragmentation among the major browser versions, and a disconnect between engineers and designers, had led to a scene in which web design was becoming increasingly ugly and hacky.  I credit Zeldman's book as the critical turning point in the history of web development which enabled a disciplined standards-driven approach to finally come about.  Unfortunately, we all thought that IE6 would be the last of Microsoft's broken browsers, but we had to wait another ten years (for IE 10) before we could actually trust IE to behave in a reasonably standards-compliant fashion.

I am not by any means a designer.  My professional career has been largely concentrated on the back-end, typically very far away from html, CSS and Javascript.  I setup many a LAMP server back in the day, mainly for clients and friends who needed tabulation, reporting systems, CRUD interfaces, and other data-focused projects where even my very basic minimal design skills were acceptable to get the job done.

Today's tools for front-end web development are so much more advanced than they were ten years ago, it's so much easier to make a nice looking website.  With this claim I certainly do not intend to devalue the work of front-end engineers and designers, far from it.  I only mean that it is so much easier for a guy like myself to make a decent looking website without having a lot of talent, and without even having to invest that much time into it.  Real designers and front-end developers are indeed moving far beyond the basics and into some extremely challenging and beautiful UIs that yesterday's tools were simply incapable of making possible.  Take a look at the [Discourse](http://www.discourse.org/) project as one great example of this.

My ambitions are decidedly less complicated.  For the most part, my main priority is content.  For my personal blog, the main goal is simply to make my words public, to share my thoughts and ideas.  At the same time, however, I do have some personal hangups about form.  I've never been satisfied with boilerplate templates and the ordinariness that the major blogging platforms impose.  Yet, content management systems are not an easy undertaking.  Every time I try to write my own, I get quickly frustrated trying to build features that others have already done very well.

Being more of a Python-Postgres guy and not so enthralled with the PHP-MySQL platform of Wordpress, I tried a few python blog engines.  I tried mezzanine for awhile but it seemed to me to delve into too much unnecessary abstraction.  I tried django, which worked for awhile but for me there were several drawbacks.  First, keeping up to date was hard.  New django releases invariably borked my code and every few months I would have to revisit the guts of my system and rewrite it, just to do basic stuff.  The admin tool, while an easy interface to use, still meant having to login to my server and copy and paste, preview, edit, etc.  it was a tiresome workflow.  Second, server maintenance just for a blog was a hassle.  Did I really need a server to publish what were essentially static pages?  Did I really need to have a database backend for text files?

### Jekyll

This all changed when I discovered [Jekyll](http://jekyllrb.com/), the static site generator that powers GitHub Pages.  I'm not much of a Ruby guy, but with Jekyll you don't need to be a Ruby programmer to work with it.  It definitely ranks among the best software I have ever used.  Jekyll provides all the functionality you need for a basic static blog out of the box, while still making it very easy to add features and customize to satisfy your quirks.  Working with Jekyll is incredibly easy, and the [documentation](http://jekyllrb.com/docs/home/) is wonderful.  Below I will document the basics of installing and using Jekyll.  My primary development system is on OSX.  If you are using linux or cygwin, the commands will be similar but you may need to check the docs for additional notes specific to your platform.

As a prerequisite for using Jekyll, you'll need to have a recent version of ruby installed on your system.  Check that with the following command:

```bash
ruby --version
```

Next, you will need a recent version of the Ruby gem module.  Check that this is also installed:

```bash
gem --version
```

If both of these work then you can try installing jekyll with this command.  Note that since this will make system-wide changes (installing into /usr/bin), you'll need elevated privileges in order to run the install, thus I'm using `sudo`.

```bash
# install jekyll
sudo gem install jekyll
```

Using jekyll is super easy.  Find a suitable location to store your work and run the following to create, build, and serve a test site:

```bash
# create a new project
jekyll new project
cd project

# build in ./_site
jekyll build

# view with development server: http://127.0.0.1:4000/
jekyll serve
```

If you spend about 15 minutes with the [Jekyll documentation](http://jekyllrb.com/docs/home/), you'll learn everything you need to know about how to build your new static blog.  The basic workflow involves the following steps:

1. Create posts in the `_posts` directory, using [Markdown](http://daringfireball.net/projects/markdown/syntax).
2. Edit or create new html templates in the `_layouts` directory.  Put common code in `_includes`.  The template layout uses the [Liquid](https://github.com/Shopify/liquid/wiki) engine.
3. Write styles in Sass or Coffeescript in the `_css` directory, or use your own build system to generate css.
4. Configuration settings are stored in the `_config.yml` file in the top-level directory.

If you require some customization that is not immediately supported, you can extend Jekyll by writing Ruby modules and storing them in the `_plugins` directory.  For my blog, I wanted to approach categories somewhat differently than the standard setup, but luckily the [plugin documentation](http://jekyllrb.com/docs/plugins/) has a great example showing how to create a `CategoryPageGenerator` which made building my category index a snap.

### S3

After using Jekyll to build your blog, you'll need somewhere to serve it.  You could easily use [Github Pages](https://pages.github.com/), which was the original reason why Jekyll was built.  Another option would be to host the site on your own web server.  Since these are static pages, you could use pretty much anything to serve it without the need for additional customization -- there's no database to configure, no CMS to setup, and nothing more complex than transferring the files to your web server's root directory.  The option I chose was to use [Amazon S3](http://aws.amazon.com/s3/).

Using S3 is a painless and cost-effective way to serve a static site.  Follow [these instructions](http://docs.aws.amazon.com/gettingstarted/latest/swh/website-hosting-intro.html) to get everything set up.  The basic steps involved are:

1. Create buckets in S3.  Pay attention to what Region you select.  If you also work with EC2, it helps to keep your S3 buckets in the same region to facilitate easier and cheaper transfers.
2. Register a domain name.  You don't have to use Amazon's registrar but you will need to use Route 53 for DNS.  So if you use another registrar, make sure you can customize your DNS settings to point to Amazon's nameservers.
3. Configure your buckets.  This involves adding a bucket policy (world readable for the root bucket), and setting up logging.
4. Deploy your site.  See below for how to use `s3_website` to deploy your jekyll site to S3.
5.  Associate a domain name in Route 53.  Create a hosted zone and create a couple of A records.

The [s3_website](https://github.com/laurilehmijoki/s3_website) project provides a seamless way of uploading your jekyll blog to s3.  This can easily be installed with gem:

```bash
# install s3_website
sudo gem install s3_website
```

Create a `s3_website.yml` file in the top-level directory of your blog, copy your S3 credentials to that file, review the other options available and then run the following to test that everything will work:

```bash
s3_website push --dry-run
```

This will simulate a deployment.  It is a good idea to run this first because the script may be deleting files from S3 and you should review that everything it wants to do appears sensible.  When ready, run without the `--dry-run` option and your website will be uploaded.

And you're done ;)

### Bootstrap

In the years since Zeldman's ground breaking book a lot has changed to make styling websites as much of an engineering process as is typical of the back end.  I used to write all my CSS by hand and there were some great ways to do this fairly effectively.  Eric Meyer's CSS Reset provided a great way to get started by providing a consistent foundation on which to begin building your site's styles.  The Yahoo User Interface project has been another great resource.  I've relied heavily on their base and typography styles and grid layouts for essential scaffolding.

The emergence of mobile devices complicates the CSS problem greatly.  Now with 4 major desktop browsers, two very different mobile platforms, and lots of different tablets, this means that screen sizes and device capabilities can vary tremendously.  Managing all this by hand means it is very time consuming to produce good looking sites that work on such a wide variety of devices.  Turning to a CSS framework can greatly simplify the management of all these contingencies.

One of the most popular CSS frameworks to emerge in recent years is Twitter's [Bootstrap](http://getbootstrap.com/).  Not only does this greatly simplify your front end work, it provides a wide array of CSS classes with which to structure your site.  Not everyone will be comfortable fitting into the bootstrap mold, but in general I find the structure not too confining and the trade-offs acceptable given the great deal of convenience in using the myriad features of the platform.

The main problem you will face when using bootstrap is how to avoid making your site look like everyone else's.  Fortunately there are a few things you can do quickly to differentiate yourself while still leveraging all the goodness that bootstrap offers.  

Working with bootstrap can be daunting at first.  As a first step, you will probably be tempted to begin by linking to the pre-built version of bootstrap provided on their CDN and then making your customizations by overriding the default styles in a secondary stylesheet.  While this approach is fine while starting out to familiarize yourself with the platform, to really be productive you are going to want to setup a workflow for making a custom bootstrap build.  It's not as hard as it sounds and the payoff is very valuable.  I'll share my workflow and some simple steps you can do to get a great looking but still unique bootstrap site.

The first thing you will want to do is get the [bootstrap source code](http://getbootstrap.com/getting-started/).  While you can download the zip file directly from the project page, this means you will have to manually repeat this step each time a new version is released, or if you need to work on multiple machines.  In the long run, this won't make for an efficient workflow.  To solve this, we are going to turn to some tools that can help automate the procedure.

The Node Package Manager is an excellent resource for front-end development work.  Visit the [Node.js](https://nodejs.org/) project page and follow the installation instructions for your platform.  This will provide you with the `npm` binary.  To make sure you are up to date, run the following command in your shell:

```bash
sudo npm install npm -g
```

The primary purpose for installing `npm` is to use it to install several additional packages that will enable our custom bootstrap workflow.  Run the following commands to install the suite of tools that we will use to make our custom build:

```bash
sudo npm install -g less
sudo npm install -g less-plugin-autoprefix
sudo npm install -g less-plugin-clean-css
sudo npm install -g bower
```

The first command installs `lessc`, a CSS compiler that translates less source files into CSS.  For more information and documentation, see the [less project page](http://lesscss.org/).  Next, we install two plugins for less that provide some much-needed functionality.  The [autoprefix plugin](https://github.com/less/less-plugin-autoprefix) will post-process your less files and automatically add any special browser prefixes for certain CSS rules.  This lets you write standard CSS and not worry about all the special browser exceptions.  As an example, see what happens when we pipe `"box-sizing: border-box;"` through the auto-prefixer:

```css
$ echo ".test { box-sizing: border-box; }" | lessc --autoprefix -  
.test {
  -webkit-box-sizing: border-box;
     -moz-box-sizing: border-box;
          box-sizing: border-box;
}
```

The second plugin, [`less-plugin-clean-css`](https://github.com/less/less-plugin-clean-css), allows you to minify your final CSS files to save space when you're ready to upload to your site.  Both of these plugins are easy to use and incorporate into your workflow on the command line.

The last component, [`bower`](http://bower.io/), is a package manager that lets us specify dependencies that will automatically be downloaded for us.  We will use bower to download the bootstrap source instead of manually downloading it from the bootstrap site.  Let's get started by making a project directory for our custom bootstrap build:

```bash
mkdir -p custom-bootstrap/{css,less} && cd custom-bootstrap
```

Next, we will create a configuration file for bower, called `bower.json`.  You can do this interactively with the command `bower init`, or follow the documentation to create the file in your text editor.  The important part of the file is the dependencies section, which should look something like this:

    "dependencies": {
        "bootstrap": "~3.3.4"
    }

After creating the config file, run `bower install`, and you will then have a directory `bower_components` into which bower will have downloaded all your dependencies.  Yay, automation!

Now we can do some magic.  In our project directory we created two additional folders.  They're not strictly necessary but help us keep our project organized: `less`, in which we can store our own less source files to keep them separate from the bootstrap source code, and `css` into which we can store our compiled css files.  Bootstrap is driven by a single file called `bootstrap.less` which uses `@import` directives to include all the necessary components that comprise bootstrap.  Our first step will be to see if we can replicate a vanilla bootstrap build, to make sure all our components are working correctly.  So, let's copy the `bootstrap.less` file to our working directory:

```bash
cp bower_components/bootstrap/less/bootstrap.less less/
```

Take a quick look at the file to see how it's organized.  Before we compile it, there's one additional support file we need in order to enable the auto-prefixing plugin for less.  By default, the plugin will use a basic set of recent browsers for which to build the special browser prefixes to the CSS standard rules.  You could use the default if you like, or create a file in your project directory called `browserslist` with whatever browsers you are interested in supporting.  For complete rules on how to write this file, see the [documentation for browserslist](https://github.com/ai/browserslist#queries).  I don't have much of an opinion on which browsers to support, so I will use the list that the bootstrap project is currently using.  Here are the contents of my `browserslist` file:

    Android 2.3
    Android >= 4
    Chrome >= 20
    Firefox >= 24
    Explorer >= 8
    iOS >= 6
    Opera >= 12
    Safari >= 6

With this file in place, we can now compile the default bootstrap source:

```bash
lessc --include-path=bower_components/bootstrap/less/ --autoprefix less/bootstrap.less > css/bootstrap.css
```

If everything works, you will now have a default bootstrap build in `css/bootstrap.css`.  Link to this css file in a test html page.  It should look exactly like default bootstrap.  Of course, there's no point in doing all this just to build the default bootstrap file!  What this setup allows us to do is customize the build however we want.  Also, since we have everything setup to compile on the command line, it's easy to make changes, compile, and see the results in the browser.

At this point, my approach is to create a `site.less` file and use this as the main driver of my custom bootstrap build.  The first thing to do in this file is to import the bootstrap source file:

```css
// Start with our custom bootstrap build
@import "./bootstrap-custom.less";
```

Note I've made a copy of the bootstrap source file to emphasize that I am working on a custom build.  In that file, I have commented out many of the bootstrap components that I do not need for my blog (glyphicons, forms, jumbotron, etc.).  By commenting out un-needed components, you will end up with a much more compact css file as compared to the 100+ kilobytes of default bootstrap.

Now you have a place to put all of your custom less syntax. A notable feature of less is that you can make multiple definitions and the last one will always take precedence.  Thus, you can change any of the bootstrap variables to make your customizations.  For instance, to set a new primary color:

```css
@brand-primary:         #aa3433;
```

Or to change the default paragraph font to be a serif instead of sans-serif:
```css
@font-family-base:        @font-family-serif;
```

When you're happy with the results, put everything together to build a minified production ready css file:

```bash
lessc --include-path=bower_components/bootstrap/less/ --autoprefix --clean-css="--s1 --advanced --compatibility=ie8" less/site.less > css/main.css
```

Deciding what to customize is entirely a personal decision.  Fortunately, since we have an efficient workflow, it's easy to experiment and iterate quickly.  Also fortunately, there are many great helpful resources and examples from others who have created some very nice-looking custom bootstrap sites.  [Bootswatch](https://bootswatch.com) is a fantastic resource for custom Boostrap themes and the author, [Thomas Park](http://thomaspark.co/), provides the less source code for all the [Bootswatch themes](https://github.com/thomaspark/bootswatch/) on GitHub.  Mr. Park also wrote an article ["Customizing Bootstrap"](http://www.smashingmagazine.com/2013/03/12/customizing-bootstrap/) in which he provides some excellent background on the process of building Bootswatch themes, which was very helpful to me in coming up with this workflow.

I also benefitted greatly from the blog post [Customizing Bootstrap with a build process](http://www.nikhildabas.com/blog/2013/07/customizing-bootstrap-with-a-build-process) by [Nikhil Dabas](http://www.nikhildabas.com/).  This was very helpful in figuring out how all the pieces work together.

Because Bootstrap is such a powerful platform, it only takes some minor changes to make a nice-looking site that doesn't look exactly like everyone else's Bootstrap site.  The `site.less` file for this blog is just 90 lines, mostly changing colors, fonts, and the header and footer styles.  The fact that I am able to make a nice looking blog with such little effort is a clear indication of how mature Bootstrap is and advanced the tools are for front-end engineers and designers. Web development is an exciting and ever-changing field, it’s fun to keep up with the latest techniques, and to be able to easily experiment with different layouts and styles. Now if I could only find my ‘Under Construction.gif’ file, I’d be set ;)



