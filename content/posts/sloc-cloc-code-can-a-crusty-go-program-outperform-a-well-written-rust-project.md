---
title: Sloc Cloc and Code - Can a crusty Go program outperform a well written Rust Project?
date: 2029-10-12
---

Wow... so when they said conference I was thinking many breakout rooms and 30 people in each. This is something else.

// SLIDE CHANGE

Hello all! I am Ben. My official title is technical lead. Im a code monkey. I write code.

This talk is about a command line tool I made called Sloc Cloc and Code. The name is inspired from two similar tools called sloccount and cloc while trying to make it sound like a Guy Richie film.

As I mentioned I work for Kablamo. Kablamo builds a lot of custom software on AWS. Our backend language of choice is Go which was a problem for me because I didn't know it. I had used it a little bit for some come command line and http tools but nothing major.

As such I was working on projects in other languages such as C# and Java. 

One that came past was to upgrade a an application written in C# with a JavaScript frontend. The goal was to upgrade the frontend and fix some backend issues. It was meant to take 6 weeks. It turned into a year long death-march project.

My fault. I totally underestimated how complex it was. 

So what do we do when we make mistakes?

// SLIDE CHANGE

We overcorrect for past failures.

// SLIDE CHANGE

See the project was a code iceberg. The visible part, http endpoints, and the like is easy to see. But the real meat and bones of the application was hidden much like an iceberg.

// SLIDE CHANGE

So the question is how do we spot code icebergs.

On solution is to use a code counter.

Enter cloc. A perl command line tool. cloc counts blank lines, comment lines, and physical lines of source code in many programming languages.

Its a very full featured, but probably not known for being fast. I actually tried it on my death march project and it took longer than I was willing to wait.

// SLIDE CHANGE

The other way is to get cyclomatic complexity

However in the .NET world you can use Visual Studio to count code as well. But it also gives you a count of the complexity of code. This tells you where the problematic files are likely to be. The complexity estimate is a meaure of the number of branch conditions in the code.

So thats where we are

// SLIDE CHANGE

Are you thinking what I am? We need another code counter! One thats fast!

However I am not very orignal and I had a look around to see if anyone else had the same idea.

Two rust projects already existed, tokei and loc and BOTH claimed excellent performance.

Polyglot was also around. Written in ATS by Vanessa Mchale is probably the most interesting code counter.

Eric S Raymond also had a code counter loccount. Lastly another one existed called Gocloc.

I thought I was being orginal in the choice of language at least, but both loccout and gocloc are both in Go.

However the spin is I was going to add complexity estimates. So I decided to go ahead anyway.

// SLIDE CHANGE

Obligatory XKCD

// SLIDE CHANGE

Goals.
Learn Go.
Want the counter to be as fast as possible.
Push CPU limits (which is unlikely) OR my limits (FAR more likely).
Be as accurate as possible. I don't want to trade accuracy for speed.
Estimate complexity. TO help spot those code icebergs.

// SLIDE CHANGE

Having briefly worked on a command line application I knew roughly what I needed to do, after I read up about channels.

Have a pipeline of processes which Go supports well with channels. For some parts of the process scc spawns as many go-routines are there are cpu cores.

The use of buffered channels in scc is mostly to ensure backpressure on the previous parts of the pipeline and not for "performance"

// SLIDE CHANGE

So the first part of the pipeline. Walking the file system.

As it turns out the native Go file walk is slow, comparatively.

I tried out a few other solutions and benchmarked them, with one called Godirwalk being the fastest.

The reason is that it avoids costly os.stat calls. The other libraries use goroutines and are still beaten out.


// SLIDE CHANGE

Sadly by making scc accurate I also took out all of the performance it had.

For every second the other tools took to run scc took two.

At this point my vision darkened, I saw the author of each of the other tools (in my mind), and said "You are mine".

So my cunning plan was to add goroutines to godirwalk. This comes with another issue that because of how it is written you cannot deal with .gitignore and .ignore files.

Turns out a lot of projects use more than one .gitignore file. I found one recently with over 25,000 of them.

// SLIDE CHANGE

Still need to resolve the .gitignore issue. Otherwise the results will not be correct.

Channels are great for uni-directional work.

What we needed was a cyclical process that happens to be in parallel.

In the end David Baggerman who lives in Melbourne wrote a custom library cuba which solves the gitignore problem. Id suggest you check it out and github star him.

// SLIDE CHANGE

Now the second part of the pipeline.

Reading the files from our lovely disks into memory.

The first thing is to know your use case, so I worked out the average number of bytes in a code file which came out at about 19kb.

If you look into reading files quickly a lot of suggestions will say use memory maps. They allow you to outsource bookkeeping activitys of locations in files to the kernel.

Don't do this for small files. Its slower.

I also made a huge rookie error here. I made the biggest mistake you can make with performance. I saw something was slow, guessed what it was and was wrong.

See I thought the reading of files into memory was slow. What was actually slow was the walking of files from the disk. Hence doing so much work in the previous step.

I only noticed when I was adding times for the processed and noticed that my CPU was not being used and yet the file walk took as long as the program run time.

// SLIDE CHANGE

On to the third part of the pipeline. The processor.

There are 3 main ways that all of the code count tools work.

The first is to use regular expressions. Cloc does this.

The problem with this is not so much speed but accuracy. If you put a comment into a string cloc will flip to comment mode.

The second is to build an AST. This is how visual studio works. 

The problem is that you need to build AST for every language you want to support which is hard.

The third option is to iterate the bytes of the file and use a small state machine to track things.

I chose to use the state machine because in theory it should be the fastest method. So I implemented a state machine, got to some level of accuracy.

// SLIDE CHANGE

Oh no. It was slower than tokei. In fact for every second tokei took to process scc took 2. Not what I wanted.

At this point my vision darkened, I saw the author of token and snarled "You are mine".

// SLIDE CHANGE

This is Jackie Stewart. Hes was a very sucessful F1 driver. Thats his quote up there. What he means by this is you don't need to understand how to design a CPU not write assembally to get the most out of the computer. But it helps to know how it works.

So knowing that the CPU has caches, has pipelines has SIMD instructions is usually enough. Thankfully the compiler writers know these things are hard to understand (they are indeed beyond me) so you don't need to worry too much.

// SLIDE CHANGE

So how to go fast in 2019.

The quote is from one of the maintainers of grep.

In short.

Do as little as possible, the less you do the fast your program runs based on the wall clock.
Do as little as possible on many cores, use those extra CPU's we all have.
Do as little as possible on many cores, making it easy to do the next thing. 

This means have your caches primed, keep loops in cache and avoid branch predition fails. If you don't know what that means don't worry, I have hit 1 branch prediction issue ever. I felt like a coding genius for about 5 minute when I fixed it though.

All of the performance improves fall into one of these categories.

// SLIDE CHANGE

Next is to measure your performance.

Your bottleneck is not often what you think it is.

Go pprof and flame graphs are really good at helping with this.

Classic example of this is a C# application I helped maintain once. A page was taking over 20 seconds to load. I was working with mate and it had some 3 deep nested loop. He insisted that was the issue, and I agreed, but said we should profile first just to be sure.

Turns out the actual issue was integer casting from string to int. We swapped to a faster method, and added a cache and the page started loading almost instantly.

// SLIDE CHANGE

The next thing to do is benchmark code.

A great quote from some american "In god we trust. Everyone else bring data."

The go benchmark tools are pretty good.

If you think something is slow, prove it. Code speaks volumes.

// SLIDE CHANGE

Here we have 3 ways of checking byte slices in Go for equality.

The first uses reflection in the standard library.

The second uses bytes equal in the standard library.

The third is a loop I wrote which checks each byte for equality.

So which do you think would be the fastest?

// SLIDE CHANGE

So reflection as you probably guessed is right out. Reflection is almost always slow.

What was suprising to me was that my loop was the fastest. 

Why?

The really nice thing about Go is you can poke at the code inside the libraries, and its usually not some hand optimised assembally. Bytes actually looks the same to the code I wrote, except it checks that the lengh of each slice is the same before it processes.

So you can do better than the standard library from time to time if you have constrained requirements.

// SLIDE CHANGE

This is one of the bigger performance improvements I found.

These both show 2 different ways that the core loop in scc works.

The left loops the bytes, switches to the state checks if we should leave that state and if so updates it then returns to the loop.

The right loops the bytes, switches to the state, and the loops again looking for a state change or a newline, then updates and returns to the loop.

// SLIDE CHANGE

As it turns out the method with the additonal loop is actually faster. Why?

Well it turns out most programs don't change state that often. So despite the code smell of the addtional loop this actually does less work, and the tight loop is very cpu friendly.

// SLIDE CHANGE

So this is a serious micro optimisation but assuming you have a very tight loop you can sometimes eake out addtional performance by juggling if statements. This is a combination of doing less and in some cases helping the CPU branch predictor.

// SLIDE CHANGE

One of the main changes to see was in how it loops looking for matches. 

The first solution implemented used a loop over the terms for each byte. This is rather wasteful.

It was cut down using bitmarks of the terms we are looking for, and then if we have a bitmatch then we perform the loop looking deeper to see if we have an actual match. 

The last improvement was to use Trie structures. A sample trie is shown containing some terms. For those following along I have linked a nice blog post about this.

// SLIDE CHANGE

So the GC is something I like and dislike in Go. I dislike that all you really get to turn it is an on/off swtich. 

I also dislike that its optimised for latency. Which is great for HTTP and UI things but not for number crunching.

In scc because its a short lived program it actually turns off the GC untill a file threshold has been passed.

// SLIDE CHANGE

Another small but important change is lazy loading of language features. Because they are stored in the previously mentioned trie, the trie needs to be built for the language. It used to process all the languages in a single pass, but was changed to lazy load them in as required which gave a nice performance boost.

// SLIDE CHANGE

Ah edge cases. The bottom of any code iceberg. 

In no particuallar order.

Verbartim strings. These are especially annoying because they are a special edge case.

Nested multi line comments. I didn't even know this was a thing. Its a complier error in Go for example. Its how valid in Rust. Which means you need to keep a queue and push and pop to ensure you match correctly.

D. Any D programmers? So D is problematic because it supports nested multi line comments, and has two ways of declaring them and you can nest them inside each other. This is an edge case I cannot be bothered to fix and I keep it as a open bug.

Docstrings in python are annoying because people quite often don't want them counted as code. So you have to check if the previous bytes were whitespace to a colon.

Byte Order Marks. So they are not actually required in UTF-8 and the spec suggests not to use them. For whatever reason they are common though. So you need to check for them, and if found skip them otherwise you can count the first line of a file as code when it might actually be a comment.

// SLIDE CHANGE

Step four. Bring it all back to you.

So the output for scc is limited.

Its also a lot of string concaternation.

I found a nice benchmark which shows which methods are the fastest, and then I didn't use those.

See its such a small amount of runtime in the application I opted to use a new Go feature, to avoid people compiling using an old version.

I did compare this specific implementation to a nice column processor I found because I was able to be very specific about it it runs in about half the time.

// SLIDE CHANGE

So this is some output for scc. Its showing us the results for each file, sorted by complexity. I know the most complex file in the codebase is probably workers.go were most of the code processing logic lives, and thankfully scc is able to identify it.


// SLIDE CHANGE

So benchmarks. Here is a benchmark over the redis code base between all the code counters I have talked about. I mostly included this one to illustrate the performance gains all the newer tools have over cloc. Cloc is on the bottom.

When I tried charting this using the linux kernal all the new tools were a thin smear on the left side.

I will be dropping cloc from further comparisons.


// SLIDE CHANGE

So there is no such thing as a fair benchmark. I wrote one of the tools so I am biased.

Also each program supports different languages. Scc includes XML, JSON and TEXT files for example.

Ignore files are only supported in some language which can increase or decrease the work to process.

String support which is an addtional level of bookkeeping is only supported by scc and tokei.

Also scc supports complexity estimates.

So I tried to create as fair a benchmark as I could. It consists of thousands of files in wide spanning directories to which all counters produce the same output. This means it should be a test of how quickly they can identify the files, read them into memory and count them.

// SLIDE CHANGE


DEMO

Lets start with out artifical benchmark. 

Of course artifical is just that, so lets try on a copy of the linux kernel to get a feel for the real world.

// SLIDE CHANGE

One last benchmark. This time in a slide because it takes too long to run.

10 copies of the linux kernel copied into a directory.

// SLIDE CHANGE

So can a go program outperfom a well written rust one?

YES!

However the techniques used could be moved into tokei and it would probably be just as fast.

I still think a direct port to Rust would be faster, or converting one of those tools to use the same techniques.

Well I had to re-implement almost everything myself. Although it could be argued the nice thing about reinventing the wheel is you get a round one.

I also had sacrifice some level of readability.

Also a lot of time.

I also don't think I have reached an optimum level of performance. Id love to see one of you brilliant people submit a PR that improves performance again or creates another project which crushes scc.

Also add complexity count for me please and ill move over.

// SLIDE CHANGE

Thank you, and especially thank you to the organisers of Gopherconau!