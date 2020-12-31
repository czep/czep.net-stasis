---
layout: post
title: Data analysis at the speed of thought
date: 2020-01-12
topics: data
---

I have a provocative question to ask of experienced and beginner data scientists alike, whether you are fully fluent with the syntax you use to analyze data or not quite comfortable with the command line.  Do you think a graphical tool for exploratory data analysis could make you more productive?  Would you consider using such a tool?  What would you envision such a tool be able to do for your workflow?

I'm developing an R package to help you analyze data at the speed of thought.

<!--excerpt-->

I have a provocative question to ask of experienced and beginner data scientists alike, whether you are fully fluent with the syntax you use to analyze data or not quite comfortable with the command line.  Do you think a graphical tool for exploratory data analysis could make you more productive?  Would you consider using such a tool?  What would you envision such a tool be able to do for your workflow?

In the same way that an effective visualization can reveal and communicate more insight than a basic table of numbers, I think there can be an effective visual interface to guide data analysis without having to write code.  I love writing code and I love analyzing data. But I've realized that trying to do both at the same time doesn't always work well.

In 2019 I wrote over 13,000 lines of R with another 7,000 lines of RMarkdown.  These pale in comparison to the astonishing (even to me) 62,000 lines of SQL that I wrote, but I'll save the topic of optimizing my SQL workflow for another day.  Several months ago after two intensive and tightly time-bound projects that involved a lot of exploratory analysis, I took a few hours to reflect on my workflow, in sort of a personal project postmortem.  While the project goals were met and I was happy with the results, I was often very unhappy with the way I was working to get those results.

In the course of my postmortem I identified two common themes that underpinned my general frustrations.  First, the context switch between _analyzing data_ and _programming data_ was interrupting my train of thought.  Taking my eyes off the data, even for a quick moment to type a simple command, could very easily distract me just enough to lose sight of the idea I had in mind for how I wanted the data to look.  Translating the mental model I had constructed in my head of _what_ I wanted to see into the programmatic representation of _how_ to generate it proved to be a substantial disruption.  Even for someone who is very comfortable with the command line, and even with the tight and highly expressive syntax of tidyverse packages, rapidly moving between analysis and programming introduces a cost.

The second theme I identified is that the verbose and unstructured development code that I was writing was brittle, unorganized, repetitive, and too unreliable to be distributed or reproducible without substantial revision and dedicated testing.  The raw analytical process involves a lot of iteration: exploring a lot of what become dead ends or uninteresting results or things simply not relevant to the final outcome.  As I'm exploring, I tend not to delete or overwrite any of my code, because when I used to do that I would always get to a point where I wanted to go back to a result I had played with several iterations ago.  The benefit of this approach is that everything is saved.  The downside to this approach is that everything is saved!  I don't want to delete anything for fear of needing it again, but this means that my development files become such a jumbled mess that it takes several hours of painstaking concentration at the end of a project to distill them into something I can confidently distribute.

After identifying and verbalizing these two pain points, my first instinct was to scrutinize my workflow.  What was I doing wrong?  Why was I not using these tools effectively?  What can be improved in the process to avoid these outcomes?

As an experiment I tried some alternate workflows, for example using RStudio exclusively for the next few projects.   But this did not solve the problem.  RStudio is still primarily a code editor and is designed to make programming with R easier, but not specifically to make data analysis easier.  Of course, the tidyverse packages themselves are designed to make data analysis easier, and they have indeed radically transformed, unified, and simplified the most common tasks that data analysis involves.  But, they still rely on you to program them.  What I argue is that the very act of switching from analysis to programming is what's causing the trouble.

During the exploratory phase there were times I felt like what I was doing could easily be scripted, templatized, or shortcut with sensible defaults.  Arrange, filter, mutate, group, summarize, and join.  These basic operations make the tidyverse so powerful because they are so commonly employed when understanding and exploring new datasets.  Even plotting could be jumpstarted with a few basic heuristics based on the variable type and distribution.

Here is a basic summary of the dream vision that came to mind:

1. The analysis process should be fluid, it should move at the speed of thought.  The moment you have an idea what to do next, the tool should let you do that work without taking your eyes off the data and without taking your mind away from the mental model of what you want to do with the data.
2. A tool that can guide the analytical process should also be able to maintain different sequences of code needed to generate each stage of your results.


### Going visual

There's a bias against graphical tools among technical types that is on one hand well deserved but also unfortunate. GUIs are inherently limited and the well-earned bias is the consequence of the fact that most of them have sucked.  With a GUI you're limited to someone else's prescribed workflow, while with code you are the ultimate master.  But the reason I say this is an unfortunate situation is that this bias has now forced all of us to adopt this high context-switching workflow of analysis intermingled with programming.

What if there was a GUI tool for guided data analysis that didn't suck? One that helped you explore at the speed of thought without getting in your way?  One that generated code for you that you could tweak later, but was good enough to move you along the path of discovery without distracting you from the central task at hand?

These ideas have been the guiding motivation for a new R package I've been slowly developing over the past few months.  It's not anywhere near ready for public distribution but as it progresses I want to share these ideas in hopes of receiving feedback that can help make this package more broadly useful to others.

Up next I would like to provide a few concrete examples of exactly where in the analytical process I feel that a graphical tool could improve discovery and make the process smoother and more fluid.  I'd also like to address the skepticism that will surely and rightfully accompany any grand claims that a magic GUI tool will solve all the world's problems.  Finally, I'll conclude with some thoughts on what this project is not.

### Viewing a dataframe

The first 10 rows of a dataframe are probably the least representative of your dataset, and yet these are always the first things we see.  Most datasets you bring into R will have some kind of implicit sort order.  For example, in a customer dataset the earliest customers will appear at the top.  Or in a sample of daily events, you'll see the ones that happened just after midnight.  These are likely to be very different from your _typical_ customers or events, and yet you'll be staring at them every time you print your dataframe or transform it.

Of course this is the most reasonable default, because you wouldn't want your dataset to be randomly sorted without your intent.  You need a way to quickly see a representative sample of your dataset to avoid drawing conclusions you'd make from staring at the first 10 rows. So, if you wanted to see a different sort order, or even simply view some rows from around the middle of the dataset, you'll need to do something like this:

```r

# random 10 rows
sample_n(data, 10)

# "middle" 10 rows
data[nrow(data)/2:nrow(data)/2+10,]

```

Doing this every time you make some changes to your data will get tiresome quickly.  A common pattern I encounter in event-based data is something like "show me a random id sorted by time".  You could easily do this:

```r

arrange(data, id, timestamp) %>% print(width=Inf)

```

But you're still facing the problem that you'll be looking at the smallest ids (or largest if you reverse the sort order) and this is not likely to give you a good understanding of the data for a typical id.    To solve this you could manually find some typical id, or identify a reasonable cutoff and filter the results like this:

```r

filter(data, id > 999999) %>%
  arrange(id, timestamp) %>%
  print(width=Inf)

```

It took me about 20 seconds to type that, but in doing so I also had to recall the appropriate function names, the order of arguments, twist my fingers to type the magrittr pipe operator twice, and remember that I've got too many columns in my dataset so I need to explicitly add the `width=Inf` option to `print`.  That's a lot of junk I had to load into my head simply to come up with the answer.  I was looking at some dataset and in a few milliseconds I got the idea that I should look at a random id sorted by time.  What if I could have accomplished that in one or two clicks, without ever taking my eyes off the dataset?  
If you're still not intrigued and this extra mental context switching doesn't bother you, consider what you'd do if you wanted to page through the results.  Ok, one quick fix could be to add `n=20` in your argument to print, but this isn't real pagination.  You'll start cluttering up the terminal real quick, and if you decide you'd like to go backwards then you have to change your filter cutoff.

Now or course you could write a pagination function and give it a real concise signature so you'd only have to do something like this:

```r

data %>% page(-1)

```

But you've still got to type it or copy-paste or up-arrow and then change the argument when you need to and by now you've really cluttered up your terminal.
Real pagination controls are dead simple to operate in a graphical data table widget.  You can have simple buttons to quickly navigate back and forth and with everything displayed in-place, you won't have the terminal clutter problem any more.

Pagination is just the beginning.  A well designed data table interface can offer quick and intuitive ways to sort, filter, recode, and more.  But before I get too sales pitchy, let me address some of the reasons why this may not work.

### Healthy skepticism

I already alluded to one of the central counter-arguments: that by their nature, GUI tools are simply not as good as the command line.  Graphical tools are inherently limiting because there's only so much functionality you can pack into a few buttons.  They can easily be a hindrance if not designed intuitively and they require a certain amount of practice to get used to before you'd realize any productivity benefit.  They're not portable, so any investment you make in learning one will basically lock you in.  Learning the syntax of R programming, on the other hand, is a much better investment because it unlocks anything you can dream of.  This is a valid concern.  Any graphical tool will need to truly excel at its task in order to overcome the sunk cost of adopting it into one's workflow.

One may also argue that the context-switch between analysis and programming as I've outlined it really isn't that disruptive.  After developing a fluency in R, you may feel that writing code to express what you want to do with the data is perfectly natural and flows easily.  It may even work in synergy with the analytical mindset because it requires you to take a few extra seconds to think about how to perform the next step in your analysis.  No such magic GUI tool exists, and if it did it would bring only marginal improvements to an expert's workflow, perhaps even slowing them down.  While I think these are valid concerns and will make this project very challenging, I don't think they're deal breakers.

For one, I keep returning to the frustration I felt when quickly trying to do simple things with new datasets.  Even as someone who firmly prefers writing code and is very comfortable doing so in R, there were very clear times when I could envision a graphical tool being able to help me understand the data a lot faster and without interruption.  I suspect there is a sizable population of R data scientists who might come to the same realization.  A wonderful thing about data analysis is its creative element---there's science and engineering involved of course, but there's also some art to it.

In the same way that some people learn better with videos while others prefer text, I think there is a lot of potential in a good graphical tool for guided data analysis.  Perhaps it will turn out that this project will be most useful for beginners.  It could serve as a good platform for learning data analysis without first having to conquer the learning curve of R.  While that would be enough of a success for me to want to continue working on this project, I am primarily driving it based on my own needs and interests so the intent is for it to also be useful for those who already know R very well.


### What this project is not

Even though it's still not clear even to me exactly what it is that this project will evolve into, there are a couple of clarifications as to what I am not building.  First, I don't want to think of this project as "a GUI for R".  Not only would that be an enormous and daunting undertaking, it would also frame the project in the wrong way.  The goal is not to map a subset of R into a point and click interface.  The goal is to use R as the backend for a guided data analysis visualization.  I'm not interested in simply making a graphical version of R functions.  R is just the means to an end and I don't want to lose sight of the end by feeling anchored by only that functionality that R provides.  In my vision, the R backend that is driving the data transformations in response to user input could just as easily be written in python using pandas for instance.

Second, this project is not a substitute for or competitor with RStudio.  My package will simply be a package, one that you can install and run in your R session using whatever platform you normally use for R, whether it's the terminal, RStudio, or the R GUI app that ships with R.  I'm not trying to "make a better RStudio" and the motivation for this project has nothing to do with the pros and cons of using any particular R interface.

### What's next?

Following my postmortem I began to explore what possible solutions would make sense.  I asked what would be the most promising platform to build on and started hacking on a bunch of different alternatives.  Once I landed on what seemed to be the right combination on which to iterate, I set out to make a proof of concept that would at least prove out the potential.  I had wanted to complete that at the end of 2019.  I'm still not at a point where I feel good about releasing it yet, but I do feel like the proof of concept has life in it.

The point of this post was to simply outline my motivation for this still un-named project.  After focusing on the high-level design and technical implementation it seemed to be a good stopping point to shift gears and start writing about the purpose and some of the exciting learnings I've had along the way.  In the next post I'll get to share some of that excitement and how I got started building.  Stay tuned for the next post!

