---
title: Sloc Cloc and Code - Can a crusty Go program outperform a well written Rust Project?
date: 2029-10-12
---



Wow... so when they said conference I was thinking many breakout rooms and 30 people in each. This is something else.

// SLIDE CHANGE

So I Ben. I am not an alcholic, but I might be if this does't go well. 

My offical title is technical lead but really I am a code monkey. I write code.

This talk is about a command line tool I made called Sloc Cloc and Code. The name is inspired from two similar tools called sloccount and cloc and trying to make it sound like a Guy Richie film.

As I mentioned I work for Kablamo. Kablamo builds a lot of custom software on AWS. Our backend language of choice is Go which was a problem for me because I didn't know it. I had used it a little bit for some come command line and http tools but nothing major.

As such I was working on projects in other languages such as C# and Java. 

One that came past was to upgrade a an application written in C# with a JavaScript frontend. The goal was to upgrade the frontend and fix some backend issues. It was meant to take 6 weeks. It turned into a year long death-march project.

My fault. I totally underestimated how complex it was. 

So what do we do when we make mistakes?

// SLIDE CHANGE

We overcorret for past failures.

// SLIDE CHANGE

See the project was a code iceberg. The visible part, http endpoints, and the like is easy to see. But the real meat and bones of the application was hidden much like an iceberg.

// SLIDE CHANGE

So the question is how do we spot code icebergs.

On solution is to use a code counter.

Enter cloc. A perl command line tool. cloc counts blank lines, comment lines, and physical lines of source code in many programming languages.

Its a very full featured, but probably not known for being fast. I actually tried it on my death march project and it took longer than I was willing to wait.

// SLIDE CHANGE

However in the .NET world you can use Visual Studio to count code as well. But it also gives you a count of the complexity of code. This tells you where the problematic files are likely to be. The complexity estimate is a meaure of the number of branch conditions in the code.

// SLIDE CHANGE

Are you thinking what I am? We need another code counter! One thats fast!

However I am not very orignal and I had a look around to see if anyone else had the same idea.

Two rust projects already existed, tokei and loc and BOTH claimed excellent performance.

Polyglot was also around. Written in ATS by Vanessa Mchale is probably the most interesting code counter.

Eric S Raymond also had a code counter loccount. Lastly another one existed called Gocloc.

I thought I was being orginal in the choice of language at least, but both loccout and gocloc are both in Go.

However the spin is I was going to add complexity estimates. So I decided to go ahead anyway.

// SLIDE CHANGE

Goals.
Learn Go.
Want the counter to be as fast as possible.
Push CPU limits (which is unlikely) OR my limits (FAR more likely).
Be as accurate as possible. I don't want to trade accuracy for speed.
Estimate complexity.

// SLIDE CHANGE

Having briefly worked on a command line application I knew roughtly what I needed to do, after I read up about channels.

Have a pipeline of processes which Go supports well with channels. 

I also Use buffered channels to ensure backpressure when processes get bogged down.

// SLIDE CHANGE

So the first part of the pipeline. Walking the file system.

As it turns out the native Go file walk is slow, compartively.

I tried out a few other solutions and benchmarked them, with one called Godirwalk being the fastest.

The reason is that it avoids costly os.stat calls. The other libraries use goroutines and are still beaten out.


// SLIDE CHANGE

Sadly this still isnt fast enough. The file walk was bottlenecking the CPU processing, which is probably the last thing most people would expect.

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

// SLIDE CHANGE

This is Jackie Stewart. Hes was a sucessful F1 driver. Thats his quote up there. What he means by this is you don't need to understand how to design a CPU not write assembally to get the most out of the computer. But it helps to know how it works.

So knowing that the CPU has caches, has pipelines has SIMD instructions is usually enough. Thankfully the compiler writers know these things are hard to understand (they are indeed beyond me) so you don't nmeed
