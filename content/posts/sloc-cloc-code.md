---
title: Sloc Cloc and Code
date: 2018-04-06
---


https://github.com/Aaronepower/tokei/issues/175
https://github.com/gnewton/hashstream
https://gobyexample.com/sha1-hashes

TL/DR

 - scc is a very fast and accuracte code counter with complexity caluclations and cocomo estimates
 - tokei could be equally fast if it copied the file walk from ripgrep
 - unless you really really really need speed a lot of the below below is probably not applicable
 - for most of these tools the bottleneck appears to be how quickly you can walk the file tree
 - mmaps for reading files is useful if the file you are opening is >= 6 MB in size
 - don't forgot the golden rule of performance which is to profile/measure, profile/measure and profile/measure again
 - best case vs worst case performance for parallel file tree walking is quite large
 - the default file walker in Go is slower due to calling os.Stat on every node and not running in parallel

So it started by wanting to write a code counter that would be faster than cloc. An elegant weapon for a more civilized age.

For those who have never encountered cloc https://github.com/AlDanial/cloc it is what appears to be simple command line tool (it is not simple and has a LOT of functionality!) that iterates through a given directory checking files against a known list of programming languages and then counting the number of code, comment and blank lines. For getting an overview of how large a project is and what languages are being used it is incredibly useful. I remember first using it early in my career to estimate project sizes.

Cloc is written in perl and is probably not known for its performance (I don't know of anyone who claimed it to be fast). Running it on a small directory with 6 files on my development machine takes ~1.7 seconds. I gave up running it against a larger codebase like the linux kernel but lets just say it takes long enough to brew a pot of coffee.

It got me thinking, what is fast enough? What sort of performance should I aim for? I want it to be faster than cloc, but how much faster?

I would generally argue that performance, like money, isn't everything unless you have none. Get it working, make it right, make it fast. In that order.

For user driven tools performance can be everything. When I ask a program to do something I want it done now dammit. Some users may be prepared to wait a while for a result if they percieve value in it such as calculating your tax figures. Programming tools tend to fall into the I want it now. You may only run it once every few days, but if its so slow as to produce finger tapping it quickly becomes frustrating, causes the mind to wander and produtivity to go down. 

It also causes the devloper to start thinking that they could make it run faster if they wanted and they start opening a repository and implementing a new version while waiting. Apparently waiting for C to compile is why Go became a programming language. Performance is also one of the reasons Google became so popular so quickly.

The other reason Google became popular was accuracy. The flip side to performance is that it usually comes at the expense of accuracy. Usually it is about trade offs. Are you willing to trade speed for accuracy? If you don't require any accuracy I promise to make the fastest program you have ever seen.

So having established through some flimsy "I am a programmer and my tools are special" hand waving I decided I needed to make the fastest possible code counter. I want it to push the boundries of the hardare (unlikey) or my own abilities (much more likely). Oh and I don't want to trade speed for accuracy. I want both.

To make things easier I decided to implement only the basic count that cloc provides and not the fancy SQLite output it provides. CSV and JSON output is about as far as I am going to go. This scope expanded as I progressed however.

Next I had a look over at the steam hardware survey to see how many CPU cores the average developer is likely to have these days http://store.steampowered.com/hwsurvey which turned out to be 4.

As such I set the task that I want to optimise for 4 or more 64 bit cores with 8 GB of RAM and a SSD drive. Even if this means that those with less powerful hardware suffer a slight performance penalty.

Beating cloc or its plugin sloccount (another code counter application which improves performance and provides COCOMO cost estimations) did not seem like such a high bar.

However I am not creative enough to be the only person to have had this idea. A quick search around and I quickly identified two other projects which have the same goals. Great! Now I have addtional tools to compare my results against! Oh no! Both are written in Rust and BOTH claim to have excellent performance.

 - Tokei (a great name) https://github.com/Aaronepower/tokei in its own words is a program that allows you to count your code, quickly.
 - Loc https://github.com/cgag/loc claims to count lines of code quickly. It also claims to be 100x faster than cloc and ~2-10x faster than tokei, depending on how many files are being counted. 

Also there was another,

 - Gocloc https://github.com/hhatto/gocloc which claims to be inspired by Tokei.

This might be a problem. 

I have experimented with Rust before and I was blown away with the performance you can wring out of it. So should I implement yet ANOTHER code counter in Rust? No. I like a challange though http://www.boyter.org/2017/03/golang-solution-faster-equivalent-java-solution/ and I was looking to expand my knowledge of Go and learn how to write multi CPU core aware code in it. So I chose Go, ignoring the fact that Gocloc already exists.

I started thinking about what sort of projects should I optimise for? After all at some point we may need to make a trade off in performance in calculating for larger vs smaller repositories. If only I could get an average of the number of files in a repository?

After thinking for a while I discarded this idea. I said I wanted absolute performance. This means I wanted it to work quickly on small and large directories. If I can optimise for one it should be possible to optimise for both.

Given that tokei and loc exist it means I want to beat both of them when it comes to processing. Its good to have lofty goals. However to set the difficulty as hard mode I want to be as close to the performance of ripgrep as possible. 

Ripgrep if given the right search term should scan every byte of every file. It gives an excellent idea of just how quickly you can pull a directory full of files into memory and inspect every byte. Will I be able to beat ripgrep's performance? Realisticly probably not, as I suspect its getting as close to as much performance you can get out of the machine as you can, and I am going to be working in a slightly higher level language. Besides they aren't the same tool so I can only use it to guesstimate what numbers I should be getting. 

Remember that any comparisons to ripgrep is very much comparing apples to oranges. It does not whitelist files and is generally doing more work per file than anthing I am building.

Regarding performance, specificly CPU performance. Back on the old days of single cores and real programmers http://www.cs.utah.edu/~elb/folklore/mel.html https://en.wikipedia.org/wiki/The_Story_of_Mel there was only one way to make code faster. Have it do less http://asserttrue.blogspot.com.au/2009/03/how-to-write-fast-code.html  The less it did the faster the program finished based on wall clock time. To quote one of the maintainers of grep "The key to making programs fast is to make them do practically nothing" https://lists.freebsd.org/pipermail/freebsd-current/2010-August/019310.html 

Those days and the "free performance lunch" ended a while ago and now the answer is a bit more complex.

Nowday's you want your program to do as little as possible, on many cores, while making it easier for the cores to do the next thing. This means you need to run the program in parallel, while being friendly to the CPU caches and the branch predictor. Thankfully compilers and CPU designers understand that these things are hard for all but the most brilliant of developers (I am not in this category). As such you probably don't worry too much about anything except how to run things in parallel. That said if you run into one an issue that can be solved by changing a branching instuction to help the predictor (I have done this exactly one time) you will feel like a programming god for a while.

Architecture. Since this was my second attempt at a Go project I was able to use the benfits of hindsight to avoid making similar mistakes. The first one I made was dealing with lists. Coming from a C#/Java/Python background where the way to make code run in parallel is to build a list and then use parallel streams, parallel linq or multiprocessing to iterate over that list using all available CPU's. However in Go what you really want to do is build streams.

The other thing you need to do is let your prejudices go and embrace goroutines. The idea of spinning up thousands of threads in something like Java is going to land you in a world of pain. However the same cannot be said of Go. Not going to dive into this too much but suffice to say so long as you limit the CPU bound GoRoutines to the number of CPU's you can get away with many thousands performing other tasks.

Given the above this is the design I came up with.

    Walk Process -> File Reader -> File Processor -> Summeriser

With each process talking to each over using a channel with a buffer set to the number of CPU cores.

http://webgraphviz.com/
digraph G {
  "Walk Process" -> "File Reader"
  "File Reader" -> "File Processor"
  "File Processor" -> "Summeriser"
}

![Architecture](/static/sloc-cloc-code/Sketch1.png)

I did at one point put channels as buffers between each of the work processes however as the application turned out to be CPU bound this was pointless. The reason for this is that by setting the size of each buffer I can control the parallelism of the code. Getting back to making things fast I only want there to be as many file processors as there are CPU's. We want to avoid CPU context switches there if at all possible. By having buffers between I can control the the number of workers without blocking any other task. Just because the File Reader or File Processer is slow there is no reason to block the Walk Process. 

It turned out that just making it as simple as possible worked equally as well for everything I tried, so I removed the intermediate buffers.

I then started building out the calculation process. For the first attempt I wrote a simple state machine that produced reasonable outputs for the samples I had. Happy with the inital results I started to look at performance.

## The Quest for Disk Performance

One thing I noticed early on is that directory walking using the native Go file walker is slow. How slow you ask? See http://www.boyter.org/2018/03/quick-comparison-go-file-walk-implementations/ where I posted some quick stats on it. As such I swapped out for the fastest implementation I could find which was godirwalk.

I then tried thigs out on a Digital Ocean compute optimized virtual machine with 32 GB of RAM and 16 vCPUs. I picked this class type because my assumption is that most of tools I was comparing against would be either Disk or CPU bound. 

I installed all the applications I was testing against, uploaded the latest version of scc, cloned the linux kernel and started some basic benchmarking.

```
root@ubuntu-c-16-sgp1-01:~# hyperfine 'rg . -c linux' && hyperfine './scc linux' && hyperfine 'tokei linux' && hyperfine 'loc linux'
Benchmark #1: rg . -c linux

  Time (mean ± σ):     332.4 ms ±  19.5 ms    [User: 2.419 s, System: 0.804 s]
  Range (min … max):   307.2 ms … 363.6 ms

Benchmark #1: ./scc linux

  Time (mean ± σ):      1.650 s ±  0.133 s    [User: 14.231 s, System: 1.059 s]
  Range (min … max):    1.502 s …  1.929 s

Benchmark #1: tokei linux

  Time (mean ± σ):      1.828 s ±  0.148 s    [User: 18.832 s, System: 1.032 s]
  Range (min … max):    1.542 s …  2.020 s

Benchmark #1: loc linux

  Time (mean ± σ):      3.773 s ±  0.494 s    [User: 7.126 s, System: 6.065 s]
  Range (min … max):    3.064 s …  4.463 s

```

Not a bad place to start. Compared to tokei we are slighly slightly faster and loc despite its claims is much slower. Ripgrep however leaves everyone in the dust.

Of course the question I am asking now, is why is ripgrep so much faster? On average with a warm cache it runs 4-5x faster than anything else.

Just to see if this problem scaled linaraly I make 14 copies of the linux kernel and dumped them all in a single directory. I then ran the same benchmark over that.

```
root@ubuntu-c-16-sgp1-01:~# hyperfine 'rg . -c linuxes' && hyperfine './scc linuxes' && hyperfine 'tokei linuxes' && hyperfine -m1 'loc linuxes'
Benchmark #1: rg . -c linuxes

  Time (mean ± σ):      3.999 s ±  0.095 s    [User: 34.636 s, System: 11.260 s]
  Range (min … max):    3.857 s …  4.169 s

Benchmark #1: ./scc linuxes

  Time (mean ± σ):     12.552 s ±  4.321 s    [User: 165.385 s, System: 13.575 s]
  Range (min … max):    0.719 s … 14.903 s

Benchmark #1: tokei linuxes

  Time (mean ± σ):     21.274 s ±  0.450 s    [User: 255.999 s, System: 13.573 s]
  Range (min … max):   20.693 s … 21.962 s

Benchmark #1: loc linuxes

  Time (mean ± σ):     51.652 s ± 10.148 s    [User: 98.514 s, System: 86.296 s]
  Range (min … max):   44.476 s … 58.828 s

```

Yep looks like the times scale linerarly. Note that because loc was taking so long to run I set it to run just once after its warm up. Its possible it would have been a little faster on the average had I let it continue but I was impatient. Its nice to see that this test still make scc still look good as it is still the fastest code counter here assuming we have multiple cores.

So back to the question, why is scc slower than ripgrep? I had a feeling that at this point the issue is not the processing, but the pulling of the files from disk into memory. To verify I build a version of scc with no hot loop. No checking of the bytes. Rather than do anything in the countStats hot loop it just returns.

{{<highlight go>}}
func countStats(fileJob *FileJob) {
  return
{{</highlight>}}

Of course this is a useless program with no useful output but it should establish if the bottle neck is in the CPU.

```
root@ubuntu-c-16-sgp1-01:~# hyperfine 'rg . -c linux' && hyperfine './scc linux'
Benchmark #1: rg . -c linux

  Time (mean ± σ):     338.1 ms ±   7.2 ms    [User: 2.544 s, System: 0.760 s]
  Range (min … max):   321.4 ms … 346.0 ms

Benchmark #1: ./scc linux

  Time (mean ± σ):      1.080 s ±  0.059 s    [User: 3.115 s, System: 0.932 s]
  Range (min … max):    1.018 s …  1.207 s
```

While the hot loop does add some overhead when enabled (it is iterating through all the bytes) it looks like the issue is with the reading of the files into memory. If disk were not an issue I would expect this loop to run in a similar time otherwise. So whats the difference? 

Thankfully the author of Ripgrep provided an excellent discussion and analysis of how ripgrep works https://blog.burntsushi.net/ripgrep/ pouring over this gives a reasonable idea on how ripgrep works without having to actually read code.

One of the interesting findings is that ripgrep sometimes uses memory maps, specificly for large files. By contrast scc was written to be as simple as possible and just loads the file into memory. It seems like memory maps are worth considering, or that file access in Go is just much slower, or more likely I am doing something stupid.

**Pause here.**

It's at this point I made a classic newbie mistake with performance. I didn't measure. I made an assumption and spent of lot of time digging a dry hole. This despite being a developer for over 10 years and telling everyone else "Always profile and measure. What you think will be slow probably won't be.".

If you want to skip the next section feel free. I did debate rewriting history to make myself look better but decided against it. After all there are some useful tidbits in the below.

Time to experiment with memory maps and file reading in Go.

Memory maps are something I started and finished knowing very little about. Wikipedia has a pretty good overview https://en.wikipedia.org/wiki/Memory-mapped_file but as far as I can tell in principle using them avoids the overhead of a syscall and you can use the kernels memory space to read files avoiding the memory copy. In short it can be much faster at the expense of potentially wasting some memory due to the way it organises bytes.

It was also around this time I started tweeting my results. 

Comparisons to ripgrep brought out some discussion with its author Andrew Gallant probably better known as BurntSushi. He was mostly interested in the lackuster speed I was getting from ripgrep. This was pretty quickly established to be due to me using WSL on Windows which is known to have disk performance issues. If you read the ripgrep announcement you can see he comprehensively proves that mmaps are not as fast as you would belive. This also came out in our brief twitter conversation. Not that I don't belive him but I would like some independent confirmation, and to find out at what point are memory maps worth it.

The first question I had was what is the average file size for the Linux Kernel. With this we can test on a file of the same length and know if reading such a file using memory maps is faster.

```
$ find . -name "*.c" | xargs ls -l | gawk '{sum += $5; n++;} END {print sum/n;}'
18554.8
```

The above should find all the C files in a directory and then average their length in bytes. I think. My bash-fu is lacking.

Given this lets try our benchmark on a file of that length.

```
$ dd if=/dev/urandom of=linuxaverage bs=18554 count=1
18554 bytes (19 kB, 18 KiB) copied, 0.003102 s, 6.0 MB/s
```

The above is used to make the file using random bytes from urandom. Then using an implementation that opens the file using both what scc was using IoUtil and another using memory maps.

```
$ go test -bench .
pkg: github.com/boyter/scc/examples/mmap
BenchmarkIoUtilOpen-8              20000            111981 ns/op
BenchmarkMmapUtilOpen-8              500           2614086 ns/op
``` 

Not brilliant. Memory maps appear to be ~26x slower. So what size file does make a difference then? A bit of experimentation and I managed to get the results to converge at about 6 MB. 

```
$ dd if=/dev/urandom of=linuxaverage bs=6000000 count=1 && go test -bench .
6000000 bytes (6.0 MB, 5.7 MiB) copied, 0.013786 s, 435 MB/s
pkg: github.com/boyter/scc/examples/mmap
BenchmarkIoUtilOpen-8                500           2661080 ns/op
BenchmarkMmapUtilOpen-8              500           2530480 ns/op
```

Considering the average size of a file we are searching is under 20 KB there is no point in using memory maps based on the above. 

However scc is still slower than ripgrep. Maybe its something to do with the way I am reading the file? In the above I just read the whole file at once. Perhaps mmap wants me to read chunks, process and then finish at the end. The other issue could be that because the access isn't random across the disk. Checking the latter is easier so I tried that.

I modified the test so that it walks loops over a copy of redis calculating as we go.

```
$ go test -bench .
pkg: github.com/boyter/scc/examples/mmap
BenchmarkIoUtilOpen-8                 10         138882400 ns/op
BenchmarkMmapUtilOpen-8               10         140421700 ns/op
```

Interesting. It actually gets to be almost the same performance when doing it this way. The redis source isnt exactly huge, so I tried the same test out against the benchmark of the linux kernel.

```
$ go test -bench .
pkg: github.com/boyter/scc/examples/mmap
BenchmarkIoUtilOpen-8                  1        15183734000 ns/op
BenchmarkMmapUtilOpen-8                1        15455014000 ns/op
```

Pretty much a dead heat. So it seems that using mmaps in the real world has no performance gains unless you hit a really huge file. I was getting suspicious at this point that my development machine using WSL was influincing the results. I created a virtual machine on Digital Ocean running Ubuntu to see how that fared. The results turned out to be very similar.

All I have managed to do was establish that mmaps are not the answer to my current performance woes.

This still begs the question, what is causing scc to be so much slower than ripgrep? 

I decided to try ripgrep on a file thats just large enough to be at the meeting point between the mmap and non-mmap performance size to avoid any gains from using one file read over another. I also thought I would limit the number of threads ripgrep could use as I had a feeling it might be using parallel reads to speed things up.

```
$ hyperfine 'rg -j1 .* 6mb' && hyperfine 'rg .* 6mb' && hyperfine 'scc 6mb'
Benchmark #1: rg -j1 .* 6mb

  Time (mean ± σ):      89.5 ms ±   6.4 ms    [User: 9.2 ms, System: 54.1 ms]
  Range (min … max):    73.0 ms …  98.8 ms

Benchmark #1: rg .* 6mb

  Time (mean ± σ):      55.9 ms ±   6.2 ms    [User: 23.5 ms, System: 55.3 ms]
  Range (min … max):    49.7 ms …  80.8 ms

Benchmark #1: scc 6mb

  Time (mean ± σ):      82.4 ms ±   5.3 ms    [User: 61.2 ms, System: 17.2 ms]
  Range (min … max):    76.6 ms … 105.2 ms
```

Ah ha! Looks like ripgrep spawns mutliple threads to read a file. In this case at least two as it is almost twice as fast. So if the code base has many larger files this is likely to be faster (or if its a single file) but slower for small ones unless it calculates the size in advance. Lets find out.

Trying against a fresh checkout of redis which has far fewer files in it than the linux kernal.

```
$ find . | wc -l
712

$ hyperfine 'rg .' && hyperfine 'scc .'
Benchmark #1: rg .

  Time (mean ± σ):      82.9 ms ±   8.6 ms    [User: 138.2 ms, System: 193.8 ms]
  Range (min … max):    74.5 ms … 104.6 ms

Benchmark #1: scc .

  Time (mean ± σ):      65.6 ms ±   2.2 ms    [User: 183.7 ms, System: 178.7 ms]
  Range (min … max):    62.5 ms …  72.9 ms

```

Yep. Ok so for smaller repositories we are processing about as fast as ripgrep. For larger ones though it is leaving us sucking dust.

However it still begs the question. Why is scc so much slower?

The really nice thing about Go is that since you can view the source and than since its written in Go you can peal back the layers and have a look at how things are implemented. The thing that appears to be causing us the most grief is this line.

{{<highlight go>}}
content, err := ioutil.ReadFile(res.Location)
{{</highlight>}}

So looking under the hood of ioutil.ReadFile shows that it allocates by default a buffer size of 512 KB to store the file. It then expands this out to the actual size. Sounds reasonable, but is it the most efficient way to read the file from the disk? What if we set the buffer to a much larger size and use bufio ourselves?

Some code to do that.

{{<highlight go>}}
func bufferedReadFile(fileLocation string, buffersize int) []byte {

  file, err := os.Open(fileLocation)
  if err != nil {
    fmt.Println(err)
    return nil
  }
  defer file.Close()

  output := []byte{}
  buffer := make([]byte, buffersize)

  for {
    bytesread, err := file.Read(buffer)

    if err != nil {
      if err != io.EOF {
        fmt.Println(err)
      }

      break
    }

    output = append(output, buffer[:bytesread]...)
  }

  return output
}
{{</highlight>}}

and the results,

```
BenchmarkIoUtilRead10k-8                           10000            105909 ns/op
BenchmarkBuffIoRead10k32768-8                      10000            104491 ns/op
BenchmarkIoUtilRead100k-8                          10000            134854 ns/op
BenchmarkBuffIoRead100k32768-8                     10000            177795 ns/op
BenchmarkIoUtilRead1000k-8                          3000            434045 ns/op
BenchmarkBuffIoRead1000k32768-8                     1000           1445289 ns/op
BenchmarkIoUtilReadLinuxAverage-8                  10000            107169 ns/op
BenchmarkBuffIoReadLinuxAverage32768-8             10000            109831 ns/op
BenchmarkIoUtilReadText-8                          10000            114302 ns/op
BenchmarkBuffIoReadText32768-8                     10000            113819 ns/op
```

The implementation at least as I have implemented it makes no difference with different buffer sizes or is worse most of the time.

At this point I started looking at running parallel reads of the same file. However this seemed insane as its probably faster to read continuous bytes from most small files.

So all I managed to establish in the above was that the way I used memory maps makes no difference for small files and that I cannot write better code than the Go maintainers (not a big suprise there). I did so pretty comprehensively though so I have that going for me.

Assuming that the reading from disk is about as efficent as it can be for the moment lets look at what else it could be. It was around here I started looking at profilers (which I should have done from the start) and adding more verbose output. One of the things I did was add a simple millisecond timer to determine how long it took to walk the file tree.

```
$ time scc linux
DEBUG 2018-03-27T21:34:26Z: milliseconds to walk directory: 7593
--SNIP--
scc linux  11.02s user 19.92s system 669% cpu 7.623 total
```

Oh... so that would be why it is slow. Notice that the time to walk matches the time to run almost exactly.

It would appear that the bottleneck is actually walking the file system and not the actual processing of the files, nor reading those files into memory. In other words the application is not currently CPU bound its bottlenecked by how quickly it can walk the file tree. So much for looking into memory maps or fiddling with buffer sizes. What a fool I have been! 

If we can make the walk process faster we should be able to improve the above results.

If you remember back at the start one of then first things I did was investigate ways to speed up walking the file tree. One of the candidates were implementations of parallel tree walkers. In the end it turned out that gogodirwalk was the fastest implementation even without running in parallel. Naturally my evil plan to make it run even faster was to make it run in parallel.

I modified the code to inspect the inital directory passed in and spawn a goroutine for child directory to walk that child. Then the remaining files were pumped into the processing pipeline channel. 

This approach has the problem that it makes performance unpredictable between directories. If there are many directories we spawn more goroutines and if there is only one folder we only spawn one. In short the best vs worst case performance profiles are wildly different, which is probably why the offical Go implementation does not do this.

So with the above simple process in place.

```
$ time scc linux
DEBUG 2018-03-27T21:48:56Z: milliseconds to walk directory: 3648
--SNIP--
scc linux  9.36s user 17.06s system 711% cpu 3.715 total
```

Excellent. The last time to process was ~7 seconds. It appears that we have resolved the disk bottlenecks that are my fault.

## The Quest for Accuracy

The obvious and wrong way (IMHO) to count lines and code inside a file is to use strings and regular expressions. For example cloc in its limitations section mentions that it works like this and as such cannot count some things correctly see https://github.com/AlDanial/cloc#Limitations for context but I have included the relevant portion below.

{{<highlight c>}}
printf(" /* ");
for (i = 0; i < 100; i++) {
    a += i;
}
printf(" */ ");
{{</highlight>}}

look to cloc like this

{{<highlight c>}}
printf(" xxxxxxx
xxxxxxx
xxxxxxx
xxxxxxx
xxxxxxx     ");
{{</highlight>}}

Cloc counts it as 1 line of code and 4 of comments. However it should be counted as 5 lines of code. Of the sample programs I am comparing against, tokei, loc, gocloc, cloc and sloccount, only tokei and sloccount get the counts correct.

```
$ cloc examples/complexity
       1 text file.
       1 unique file.
       0 files ignored.

http://cloc.sourceforge.net v 1.60  T=0.10 s (10.1 files/s, 50.4 lines/s)
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
Java                             1              0              4              1
-------------------------------------------------------------------------------

# bboyter @ SurfaceBook2 in ~/Go/src/github.com/boyter/scc on git:master x [8:23:18]
$ tokei examples/complexity
-------------------------------------------------------------------------------
 Language            Files        Lines         Code     Comments       Blanks
-------------------------------------------------------------------------------
 Java                    1            5            5            0            0
-------------------------------------------------------------------------------
 Total                   1            5            5            0            0
-------------------------------------------------------------------------------

# bboyter @ SurfaceBook2 in ~/Go/src/github.com/boyter/scc on git:master x [8:23:39]
$ loc examples/complexity
--------------------------------------------------------------------------------
 Language             Files        Lines        Blank      Comment         Code
--------------------------------------------------------------------------------
 Java                     1            5            0            3            2
--------------------------------------------------------------------------------
 Total                    1            5            0            3            2
--------------------------------------------------------------------------------

# bboyter @ SurfaceBook2 in ~/Go/src/github.com/boyter/scc on git:master x [8:23:45]
$ gocloc examples/complexity
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
Java                             1              0              5              0
-------------------------------------------------------------------------------
TOTAL                            1              0              5              0
-------------------------------------------------------------------------------

# bboyter @ SurfaceBook2 in ~/Go/src/github.com/boyter/scc on git:master x [8:23:56]
$ sloccount examples/complexity

SLOC    Directory       SLOC-by-Language (Sorted)
5       complexity      java=5

```

Not only does it make mistakes it is also a slower way to process. I am not going to bother testing this with any benchmarks but it is considerably slower.

So I decided that I would scan byte by byte, look through every byte of every file and using a very simple state machine determines if a line is empty, a comment, code or a string containing one of the others. Turns out this is how tokei works as well https://github.com/Aaronepower/tokei/issues/175

The other option would be to build an AST which would be much slower than byte counting and possibly slower than the regular expression parser depending on how you build it out.

Why look at every byte? This is pretty easy to answer actually. Because it has to. We need to know where strings start and end, where comments begin etc... Since a comment can be a single byte we need to check every byte to know where they are. It is unlikely to be the slowest part of the application. It's more likely that reading from disk is going to slow things down than the CPU. Not that ripgrep uses a far fancier technique https://blog.burntsushi.net/ripgrep/#linux-literal-default 

```
Counting lines can be quite expensive. A naive solution—a loop over every byte and comparing it to a \n—will 
be quite slow for example. Universal Code Grep counts lines using SIMD and ripgrep counts lines using 
packed comparisons (16 bytes at a time). However, in the Linux code search benchmarks, because the size of 
each individual file is very small and the number of matches is tiny compared to the corpus size, the time 
spent counting lines tends to not be so significant. Especially since every tool in this benchmark parallelizes 
search to some degree. When we get to the single-file benchmarks, this variable will become much more pertinent.
```

Note that scc falls into the cateogry of counting lots of small files. My benchmarks show that as Andrew claims it is not a significant portion of the runtime. So while it may be "slow" its not a factor at all in the way the application performs.

Operating on single bytes also makes it much easier to move in the state engine. However it does mean you have to check each byte potentially multiple times, so while it should be faster than reading from the disk its something to keep in the back of your mind.

However while it seems simple its not quite as easy as it would appear. Not so much from an implementation point of view but from how you actually count things. Take the following examples.

{{<highlight c>}}
i++; /*
comment
*/
{{</highlight>}}

How many lines of code is the above? I would personally say 1 with 2 lines of comments. How about,

{{<highlight c>}}
i++; /*
comment
*/ j++;
{{</highlight>}}

I would say 2 lines of code with 1 line of comment. However it can get more complex than that. Take for example,

{{<highlight c>}}
string.Format(" /* comment " +
  " something " +
  " */ ");
{{</highlight>}}

How many lines of code is the above? I would say 3. How about with multiple line strings

fmt.Println(`
  /* I am followed by empty line

  something! */
`)


All of the above is code but easily fools many parsers that rely on regular expressions. 

So looking at the above we need to code in a simple state machine that works for the above. It looks something like the below and is hideous.

http://webgraphviz.com/

digraph G {
  "Blank" -> "Code"
  "Blank" -> "Blank"
  "Blank" -> "MultiLine Comment"
  "Blank" -> "SingleLine Comment"
  "Blank" -> "String"
  "Code" -> "MultiLine Comment"
  "Code" -> "SingleLine Comment"
  "Code" -> "Blank"
  "Code" -> "String"
  "SingleLine Comment" -> "Blank"
  "MultiLine Comment" -> "Blank"
  "MultiLine Comment" -> "Code"
  "String" -> "Code"
}

![State Machine](/static/sloc-cloc-code/Sketch2.png)

A particullary incidious thing you can put that will confuse most code counters is the following

{{<highlight c>}}
/* /* */ 
{{</highlight>}}

Thankfully most languages treat anything between the first multiline comment and the first close of the comment as being valid. As such

{{<highlight c>}}
/* /* */ */
{{</highlight>}}

Is not actually valid and will be a compile error.

What about

{{<highlight c>}}
int i = 0; /* 
/**//**/
/**//**//**//**/
{{</highlight>}}

Or
{{<highlight c>}}
"``/* i++"
{{</highlight>}}

These sort of cases thankfully are rare. Given enough creative evil you can fool any of the code counters I am comparing against using things like the above including Tokei which appears to be the most accurate of them all. 

I decided early on that while I wanted accuracy I want it for 99.999% of cases. Someone trying to confuse the counter is not in that group and so I am not going to spend a great deal of time working on cases like the above.


## Trying Things Out

With the above implemented producing accurate results coupled with the work I put into disk performance I thought I would try out a quick benchmark on the most powerful Digital Ocean machine I can spin up which happens to be a 32 core monster.

```
root@ubuntu-c-32-64gib-sgp1-01:~# hyperfine 'rg . linux' && hyperfine './scc linux' && hyperfine 'tokei linux' && hyperfine 'loc linux'
Benchmark #1: rg . linux

  Time (mean ± σ):     567.9 ms ±  24.7 ms    [User: 5.183 s, System: 0.610 s]
  Range (min … max):   534.6 ms … 618.1 ms

Benchmark #1: ./scc linux

  Time (mean ± σ):     959.5 ms ±  80.3 ms    [User: 6.182 s, System: 3.362 s]
  Range (min … max):   802.4 ms … 1098.5 ms

Benchmark #1: tokei linux

  Time (mean ± σ):     877.0 ms ±  43.1 ms    [User: 12.753 s, System: 0.841 s]
  Range (min … max):   798.8 ms … 929.3 ms
```

Well thats interesting. Tokei is now the fastest running counter. I suspect that its due to how its walking though the file tree. It also suggests that Tokei could always be the fastest code counter if it changed the algorithm it uses for walking the file tree.

Let's try it out on ten copies of the linux kernel dumped into a single directory.

```
root@ubuntu-c-32-64gib-sgp1-01:~# cp -R linux linuxes/linux1/ && cp -R linux linuxes/linux2/ && cp -R linux linuxes/linux3/ && cp -R linux linuxes/linux4/ && cp -R linux linuxes/linux5/ && cp -R linux linuxes/linux6/ && cp -R linux linuxes/linux7/ && cp -R linux linuxes/linux8/ && cp -R linux linuxes/linux9/ && cp -R linux linuxes/linux10/

root@ubuntu-c-32-64gib-sgp1-01:~# hyperfine 'rg . linuxes' && hyperfine './scc linuxes' && hyperfine 'tokei linuxes'
Benchmark #1: rg . linuxes

  Time (mean ± σ):      4.815 s ±  0.206 s    [User: 50.862 s, System: 5.572 s]
  Range (min … max):    4.604 s …  5.043 s

Benchmark #1: ./scc linuxes

  Time (mean ± σ):      3.629 s ±  0.262 s    [User: 57.305 s, System: 16.077 s]
  Range (min … max):    3.257 s …  4.127 s

Benchmark #1: tokei linuxes

  Time (mean ± σ):      6.543 s ±  0.075 s    [User: 135.301 s, System: 7.722 s]
  Range (min … max):    6.433 s …  6.638 s
```

In this case it seems scc picked a more optimal number of parallel threads to walk the file tree. There is no other reason for tokei or ripgrep to be slower in this case based on the previous result.

That being the case I wanted to find out in what situations for disk layouts they work well and for which they do not. There are a few situations at test here. 

The first is a very deep directory with a few files in each sub directory. This is not friendly to parallel algorithms. Each next step requires the previous steps operation to finish and as such there isnt much you can do to offload the work. Another case of this would be a single directory with hundreds to thousands of files of files in it. Again you need to look into the directory to get the files, and there is no way to run that in parallel. In effect both look like an unbalanced tree.

So there is no point optimising for either of the above cases. Lets think about what is the optimal case. That would be a directory with subdirectories that looks like a balanced tree. The trick would be having the root having as many subfolders as is optimal to spawn threads for.

I decided to write a simple python script which would generate some directories to try out the above and see how each tool performs. The tool with the very imaginative name "create_folders_with_files.py" creates a series of directories designed to test the best/worst case situation for each of the tools. Example output of what it creates using tree is included below.

 - Case 0 Create a directory thats quite deep and put a 10000 files at the end
 - Case 1 Create a directory thats quite deep and put 100 files in each folder
 - Case 2 Create a directory that has a single level and put 10000 files in it
 - Case 3 Create a directory that has a two levels with 10000 directories in the second with a single file in each
 - Case 4 Create a directory that with 10 subdirectories and 1000 files in each
 - Case 5 Create a directory that with 20 subdirectories and 500 files in each
 - Case 6 Create a directory that with 5 subdirectories and 2000 files in each
 - Case 7 Create a directory that with 100 subdirectories and 100 files in each

With those created I did some benchmarks using scc, ripgrep and tokei.

```
$ hyperfine 'scc 0' && hyperfine 'rg . 0' && hyperfine 'tokei 0'
Benchmark #1: scc 0

  Time (mean ± σ):     603.4 ms ±  20.1 ms    [User: 494.9 ms, System: 3531.6 ms]
  Range (min … max):   565.7 ms … 629.8 ms

Benchmark #1: rg . 0

  Time (mean ± σ):     591.0 ms ±  26.7 ms    [User: 202.9 ms, System: 3283.8 ms]
  Range (min … max):   540.0 ms … 627.3 ms

Benchmark #1: tokei 0

  Time (mean ± σ):     802.6 ms ±  31.2 ms    [User: 82.6 ms, System: 3302.4 ms]
  Range (min … max):   762.4 ms … 844.0 ms

$ hyperfine 'scc 1' && hyperfine 'rg . 1' && hyperfine 'tokei 1'
Benchmark #1: scc 1

  Time (mean ± σ):     122.4 ms ±   5.9 ms    [User: 84.8 ms, System: 684.5 ms]
  Range (min … max):   112.4 ms … 136.0 ms

Benchmark #1: rg . 1

  Time (mean ± σ):     150.7 ms ±  10.8 ms    [User: 79.5 ms, System: 638.3 ms]
  Range (min … max):   137.4 ms … 171.6 ms

Benchmark #1: tokei 1

  Time (mean ± σ):     176.1 ms ±  13.1 ms    [User: 31.1 ms, System: 663.1 ms]
  Range (min … max):   160.8 ms … 210.6 ms

$ hyperfine 'scc 2' && hyperfine 'rg . 2' && hyperfine 'tokei 2'
Benchmark #1: scc 2

  Time (mean ± σ):     597.5 ms ±  21.6 ms    [User: 434.1 ms, System: 2798.3 ms]
  Range (min … max):   571.1 ms … 634.8 ms

Benchmark #1: rg . 2

  Time (mean ± σ):     471.0 ms ±  27.0 ms    [User: 163.8 ms, System: 2576.2 ms]
  Range (min … max):   427.7 ms … 515.0 ms

Benchmark #1: tokei 2

  Time (mean ± σ):     546.9 ms ±  24.8 ms    [User: 119.9 ms, System: 2552.1 ms]
  Range (min … max):   484.4 ms … 573.5 ms

$ hyperfine 'scc 3' && hyperfine 'rg . 3' && hyperfine 'tokei 3'
Benchmark #1: scc 3

  Time (mean ± σ):      1.478 s ±  0.125 s    [User: 1.001 s, System: 7.956 s]
  Range (min … max):    1.299 s …  1.774 s

Benchmark #1: rg . 3

  Time (mean ± σ):      1.141 s ±  0.022 s    [User: 591.9 ms, System: 6699.6 ms]
  Range (min … max):    1.107 s …  1.170 s

Benchmark #1: tokei 3

  Time (mean ± σ):      1.921 s ±  0.229 s    [User: 329.4 ms, System: 5250.5 ms]
  Range (min … max):    1.728 s …  2.301 s

$ hyperfine 'scc 4' && hyperfine 'rg . 4' && hyperfine 'tokei 4'
Benchmark #1: scc 4

  Time (mean ± σ):     627.6 ms ± 131.1 ms    [User: 479.2 ms, System: 4004.3 ms]
  Range (min … max):   445.2 ms … 807.5 ms

Benchmark #1: rg . 4

  Time (mean ± σ):     647.3 ms ±  52.9 ms    [User: 302.9 ms, System: 3684.4 ms]
  Range (min … max):   530.2 ms … 705.0 ms

Benchmark #1: tokei 4

  Time (mean ± σ):     742.8 ms ±  59.1 ms    [User: 126.5 ms, System: 3525.1 ms]
  Range (min … max):   596.1 ms … 806.0 ms

$ hyperfine 'scc 5' && hyperfine 'rg . 5' && hyperfine 'tokei 5'
Benchmark #1: scc 5

  Time (mean ± σ):     503.2 ms ±  30.0 ms    [User: 390.5 ms, System: 3139.8 ms]
  Range (min … max):   461.1 ms … 547.0 ms

Benchmark #1: rg . 5

  Time (mean ± σ):     523.7 ms ±  50.8 ms    [User: 196.3 ms, System: 2989.5 ms]
  Range (min … max):   413.1 ms … 580.4 ms

Benchmark #1: tokei 5

  Time (mean ± σ):     599.9 ms ±  32.8 ms    [User: 96.5 ms, System: 3052.9 ms]
  Range (min … max):   519.3 ms … 632.0 ms

$ hyperfine 'scc 6' && hyperfine 'rg . 6' && hyperfine 'tokei 6'
Benchmark #1: scc 6

  Time (mean ± σ):     470.9 ms ±  25.0 ms    [User: 435.5 ms, System: 2934.5 ms]
  Range (min … max):   417.8 ms … 518.1 ms

Benchmark #1: rg . 6

  Time (mean ± σ):     457.6 ms ±  21.2 ms    [User: 162.2 ms, System: 2548.0 ms]
  Range (min … max):   412.2 ms … 487.0 ms

Benchmark #1: tokei 6

  Time (mean ± σ):     525.0 ms ±  18.8 ms    [User: 80.8 ms, System: 2715.5 ms]
  Range (min … max):   501.2 ms … 552.7 ms

$ hyperfine 'scc 7' && hyperfine 'rg . 7' && hyperfine 'tokei 7'
Benchmark #1: scc 7

  Time (mean ± σ):     679.0 ms ±  48.1 ms    [User: 568.4 ms, System: 4111.4 ms]
  Range (min … max):   560.4 ms … 752.9 ms

Benchmark #1: rg . 7

  Time (mean ± σ):     635.4 ms ±  44.0 ms    [User: 247.8 ms, System: 3623.4 ms]
  Range (min … max):   534.4 ms … 690.6 ms

Benchmark #1: tokei 7

  Time (mean ± σ):     734.1 ms ±  42.7 ms    [User: 154.5 ms, System: 3588.6 ms]
  Range (min … max):   626.3 ms … 775.0 ms

```

What was interesting is that the tests for #4 and #5 actually got slower each time the benchmark was run for all tools. No idea what would cause that to happen other then that the layout was not friendly to whatever tricks the OS uses to speed up disk access.

What bothered me was that for the deep directory case #1 ripgrep was still on average slightly faster. I had a feeling that this was down to the garbage collector kicking in. So I tried again with it disabled.

```
$ hyperfine 'scc 0' && hyperfine 'rg . 0' && hyperfine 'tokei 0'
Benchmark #1: scc 0

  Time (mean ± σ):     510.7 ms ±  17.1 ms    [User: 360.8 ms, System: 3177.7 ms]
  Range (min … max):   472.8 ms … 532.3 ms

Benchmark #1: rg . 0

  Time (mean ± σ):     549.5 ms ±  26.8 ms    [User: 187.0 ms, System: 3168.3 ms]
  Range (min … max):   495.0 ms … 592.0 ms

Benchmark #1: tokei 0

  Time (mean ± σ):     940.0 ms ± 232.2 ms    [User: 113.7 ms, System: 3329.5 ms]
  Range (min … max):   736.8 ms … 1424.7 ms
```

Disabling GC for the walk claws back ~90 ms from the previous run and now the walk is faster than the one in riprep. In fact trying things out this improves performance considerably for all processing.

I then tried it out on a small virtual machine and managed to get an out of memory error. Maybe turning off the GC was not the best idea after all. Yes it improves performance, but it forces the user to know if they have enough RAM and make their own call. Since you can turn off the GC via an envrionment variable its probably best to leave this to the user to decide.

> So if you want things to run as fast as possible using scc and you have lots of RAM you can set the environment variable GOGC to -1 for a nice speed boost https://golang.org/pkg/runtime/debug/#SetGCPercent 

There was one thing nagging me. What happens if someone runs scc on a older style spinning rust hard disk. They are probably not very friendly to having random access all over the disk. It also caused me another issue in that I realised I don't have a spinning rust disk on any of the machines I use. Talk about making progress. I had to dig up a very old netbook using an Atom processor in order to try things out.

Turns out there was no appreciable difference as far as I can tell. I used the Django project as a test bed (which took ~20 seconds to process) and with or without a setting to reduce the number of processes it ran in roughly the same amount of time. This included runs where I dropped the disk file caches as well. Very cool.


## Optimisations

So with the application running well producing decent output and being fast I decided I wanted to add some crude complexity calculations to the output. After all yet another code counter is not that useful. Having one that could point out potentially problematic files would allow it to stand apart. Since I did that it blew away most of the performance I put in. 

A quick check on 1, 2, 4, 16 and 32 core machines showed that all of a sudden scc went from faster than tokei and loc to slower by about 2x. That is for every second tokei took to count code scc took two.

The reason is thatfor any byte I was looking at while in the code state meant there was ~8 byte checks to determine if there was something to increase the complexity. This ended up in a large block of if statements that ate all of the performance I had put into the application. Suddenly I was very CPU bound and gaining that performance lost back is a big ask.

I resorted to salami tactics. That is slice by slice whittle down every possible wasted CPU cycle.

Time to start profiling.

go tool pprof -http=localhost:8090 scc.pprof
go tool pprof scc.pprof

list github.com/boyter/scc/processor.countStats

C:\Users\bboyter\Documents\Go\src\github.com\boyter\scc>scc.exe C:\users\bboyter\Documents\Projects\linux
https://blog.golang.org/profiling-go-programs
http://localhost:8090/
https://stackoverflow.com/questions/45786687/runtime-duffcopy-is-called-a-lot


Checking profile output showed that rather unsuprisingly the core loop had suddenly become the bottle neck.

Having a look at what I had in the core loop,

{{<highlight go>}}
if currentState == S_BLANK && checkForMatch(currentByte, index, endPoint, singleLineCommentChecks, fileJob) {
  currentState = S_COMMENT
}

if currentState == S_CODE && checkForMatch(currentByte, index, endPoint, singleLineCommentChecks, fileJob) {
  currentState = S_COMMENT_CODE
}

if (currentState == S_BLANK || currentState == S_MULTICOMMENT || currentState == S_MULTICOMMENT_CODE) && checkForMatchMultiOpen(currentByte, index, endPoint, multiLineCommentChecks, fileJob) {
  currentState = S_MULTICOMMENT
  currentMultiLine++
}

if currentState == S_CODE && checkForMatchMultiOpen(currentByte, index, endPoint, multiLineCommentChecks, fileJob) {
  currentState = S_MULTICOMMENT_CODE
  currentMultiLine++
}

if (currentState == S_MULTICOMMENT || currentState == S_MULTICOMMENT_CODE) && checkForMatchMultiClose(currentByte, index, endPoint, multiLineCommentChecks, fileJob) {
  currentMultiLine--
  if currentMultiLine == 0 {
    currentState = S_MULTICOMMENT_CODE
  }
}

if currentState == S_BLANK && currentByte != ' ' && currentByte != '\t' && currentByte != '\n' && currentByte != '\r' {
  currentState = S_CODE
}

if (currentState == S_BLANK || currentState == S_CODE) && checkComplexity(currentByte, index, endPoint, complexityChecks, fileJob) {
  fileJob.Complexity++
}
{{</highlight>}}

It is reasonably complex. However thinking about it there is one quick obvious win here. If we have moved state, then we don't need to check the other conditions. Having a simple boolean to indicate that the state has changed and then skip over a lot of the checks will speed this up considerably. So I added that in and cut the runtime in half. 

This was a good start but there is a lot more that can be done, not only to improve performance but to make the code far more readable.

 - Change the logic so that we use a switch to jump to our current state and check what to do from there. This gives us the previous optimisation for free and should make things easier to read.
 - Count the frequency of each of the above ifs. We want to order them such that we hit the change state condition as frequently as possible and bail out. In other words the order of the checks matters a great deal.

I implemented the first which yielded some gains, but then realised I could convert the whole thing over to a large switch statement and save the addtional accounting overhead of checking the state.

I changed over to the the switch statement, verified it works as well as the skip checks from before and went back to profiling. Here is the the output looking at a run of the linux kernel once it has been warmed into disk cache.

```
(pprof) top10
Showing nodes accounting for 28.34s, 90.17% of 31.43s total
Dropped 225 nodes (cum <= 0.16s)
Showing top 10 nodes out of 80
      flat  flat%   sum%        cum   cum%
     9.89s 31.47% 31.47%      9.91s 31.53%  runtime.cgocall
     9.68s 30.80% 62.27%     16.85s 53.61%  github.com/boyter/scc/processor.countStats
     3.35s 10.66% 72.92%      3.35s 10.66%  github.com/boyter/scc/processor.checkForMatchMultiOpen
     3.32s 10.56% 83.49%      3.32s 10.56%  github.com/boyter/scc/processor.checkForMatchMultiClose
     0.78s  2.48% 85.97%      1.65s  5.25%  runtime.scanobject
     0.39s  1.24% 87.21%      0.39s  1.24%  github.com/boyter/scc/processor.checkComplexity
     0.39s  1.24% 88.45%      0.44s  1.40%  runtime.heapBitsForObject
     0.26s  0.83% 89.28%      0.36s  1.15%  runtime.greyobject
     0.16s  0.51% 89.79%      0.16s  0.51%  path/filepath.matchChunk
     0.12s  0.38% 90.17%      0.32s  1.02%  path/filepath.Match
```

Looking at the above you can seethat countStats, checkForMatchMultiOpen, checkForMatchMultiClose and checkComplexity are methods that I wrote that would be the best ones to investigate. A good sign is that cgocall is at the top as it means we are getting close to be bottlenecked by disk access and not the CPU.

The methods at first looked pretty tight. They all work by taking in a slice/list of things to check and then loop over the bytes inside them. 

However there is the fact that they had a nested loop inside them which is usually a bad plan. Most of the time the checks don't find anything. As such we could just check if the first character doesnt match any of the first characters in the matches and if so bail out. This makes the best case of no matches faster at the expense of a few extra lookups for the worst case of a partical match. 

Sounds good in theory. So I tried it out. I added in the first bytes we want to look for like the below.

{{<highlight go>}}
complexityBytes := []byte{
    'f',
    'i',
    's',
    'w',
    'e',
    '|',
    '&',
    '!',
    '=',
  }

  hasMatch := false
  for i := 0; i < len(complexityBytes); i++ {
    if complexityBytes[i] == currentByte {
      hasMatch = true
      break
    }
  }

  if !hasMatch {
    return false, 0
  }
{{</highlight>}}

And the results,

```
(pprof) top10
Showing nodes accounting for 49.46s, 89.12% of 55.50s total
Dropped 279 nodes (cum <= 0.28s)
Showing top 10 nodes out of 83
      flat  flat%   sum%        cum   cum%
    20.67s 37.24% 37.24%     20.70s 37.30%  runtime.cgocall
    17.41s 31.37% 68.61%     25.54s 46.02%  github.com/boyter/scc/processor.countStats
     4.06s  7.32% 75.93%      4.06s  7.32%  github.com/boyter/scc/processor.checkForMatchMultiOpen
     3.47s  6.25% 82.18%      3.47s  6.25%  github.com/boyter/scc/processor.checkForMatchMultiClose
     1.51s  2.72% 84.90%      2.93s  5.28%  runtime.scanobject
     0.76s  1.37% 86.27%      0.83s  1.50%  runtime.heapBitsForObject
     0.53s  0.95% 87.23%      0.53s  0.95%  runtime.osyield
     0.44s  0.79% 88.02%      0.44s  0.79%  github.com/boyter/scc/processor.checkComplexity
     0.31s  0.56% 88.58%      0.65s  1.17%  path/filepath.Match
     0.30s  0.54% 89.12%      0.60s  1.08%  runtime.greyobject
```

A nice optimisation. The method checkComplexity is down in terms of cumulative call time.

So looking further into the code I tried to identify what else is causing problems. Turns out that allocations are expensive when run in a tight loop. Look at the last line where I return 0 with []byte{}

```
(pprof) list github.com/boyter/scc/processor.checkForMatchMultiOpen
Total: 50.30s
ROUTINE ======================== github.com/boyter/scc/processor.checkForMatchMultiOpen in C:\Users\bboyter\Documents\Go\src\github.com\boyter\scc\processor\workers.go
         .          .     77:   if !hasMatch {
     3.08s     11.05s     78:           return 0, []byte{}
```

The second param is not actually required in this case. So by changing it to a nil return we get the following profile which improves the performance considerably.

```
         .          .     77:   if !hasMatch {
     1.56s      1.56s     78:           return 0, nil
```

The below is a serious micro-optimisation so be careful if you want to implement them yourself. Usually it means trading code reuse and readability for performance.

That said lets explore an interesting one. The following are 3 ways to compare if two byte slices are equal in Go.

{{<highlight go>}}
equal := reflect.DeepEqual(one, two)
{{</highlight>}}

{{<highlight go>}}
equal := bytes.Equal(one, two)
{{</highlight>}}

{{<highlight go>}}
equal := true
for j := 0; j < len(one); j++ {
	if one[j] != two[j] {
		equal = false
		break
	}
}
{{</highlight>}}

Which one would you think was the slowest? Which one the fastest? As you probably expected the slowest uses reflect. Reflection is almost always slow. However oddly enough the fastest is the basic for loop. Usually the answer to what is the fastest is whatever is in the standard library. However in this case the loop is able to avoid the length check required to see if the slices are the same length. This makes sense as it cannot assume that the slices are of the same length.

Also since in our case we already know that the first byte matches we can save some addtional time by starting the loop at 1. How much of a saving does this produce?

```
BenchmarkCheckByteEqualityReflect-8                                      5000000               344 ns/op
BenchmarkCheckByteEqualityBytes-8                                       300000000                5.52 ns/op
BenchmarkCheckByteEqualityLoopWithAddtional-8                           500000000                3.76 ns/op
BenchmarkCheckByteEqualityLoop-8                                        500000000                3.41 ns/op
```

As you can see reflection is right out. However by using our own loop with the 1 byte offset we can get an addtional saving. Extreme? Yes. But remember this happens in the core hot loop so these savings all add up. If you have very constrained requirements it can be worth checking to see if you can do better than the standard libaries.


Another thing I ran into was an odd method 
Did you know that range queries cause addtional allocations? It appears when you profile as "duffcopy" https://stackoverflow.com/questions/45786687/runtime-duffcopy-is-called-a-lot switching from range to index lookups can buy you a lot of performance.

Another thing that appeared in the profile was calls to Sprintf. This was caused by my trace and debug logic. Wrapping it with an if statement looks ugly but solves the issue as it is extremently friendly to the branch predictor and saves some string allocations.

```
if Trace {
    printTrace(fmt.Sprintf("%s line %d ended with state: %d", fileJob.Location, fileJob.Lines, currentState))
}
```

Another place to save some speed was with caches for certain actions. An example would be getting the extension of a file. Its pretty common to have multiple files with the same name. As such a simple Map to save the processing can dramaticly speed things up at the expense of some memory. A simple benchmark shows that the gains are not insignificant.

```
BenchmarkGetExtensionDifferent-8                                          200000              6077 ns/op
BenchmarkGetExtensionSame-8                                             10000000               138 ns/op
```

This one is pretty obvious but its nice to see what the actual impact can be which is a nice strength of the go test -bench option

The final thing to optimise is the printing code. This is rather boring so I am not going to go too indepth into it. While generally it was not an issue I noticed that if the files option was used it would take a considerable amount of time processing the lists. I was using https://github.com/ryanuber/columnize/ for this and while it worked well the additional overhead was not what I was looking for. As such I rolled my own. Since the core of it is string conaternation a quick search showed that https://stackoverflow.com/questions/1760757/how-to-efficiently-concatenate-strings-in-go there are quite a few ways to do this. Thankfully someone included a benchmark,

```
BenchmarkConcat-8                1000000             64850 ns/op
BenchmarkBuffer-8               200000000                6.76 ns/op
BenchmarkCopy-8                 1000000000               3.06 ns/op
BenchmarkStringBuilder-8        200000000                7.74 ns/op
```

Based on the above I decided to go with the Go 1.10 specific method and use string builder. Its almost as fast as buffer and copy but much easier to understand, and since the formatting happens at the very end with only a few iterations for the summary and with what can be done as results come in for the files options there is no real need to overcomplicate things. It also ensures that scc can only be built with a modern compiler so we get at least a decent level of baseline performance.

I wrote my own little benchmark over the formatters method to ensure I didn't make it slower and converted it over. 

```
// When using columise  ~28726 ns/op
// When using optimised ~14293 ns/op
```

Switching out to a custom formatter method was about half the amount of operations. It also allowed me to add line breaks to the output which was something missing in columize.


Benchmarks

What follows is going to be a highly biased (I wrote one of the tools remember) collection of benchmarks which definitively prove that scc is the fastest code counter that I am aware of. Its not only faster than cloc by a huge amount it either equals tokei or is considerably faster and leaves loc trailing as well. This is either on Windows Native or through WSL or Linux. I would try OSX but I cannot spin up a VM of one to test it out.

With that outragous claim out of the way lets see if I prove it.

I am using the excellent Rust tool hyperfine for benchmarking with 3 warmup runs and 20 timed runs to produce the results. In order to see how fast you can actually process files on the filesystem I am going to compare to ripgrep which at the moment is the absolute last word in speed for something that hits the same sort of file types. Keep in mind that the comparison to ripgrep is an apples to oranges comparison and only there to show how fast you can process files on the disk.


BENCHMARKS HERE


Of course whats likely to happen now is that either the excellent authors of Tokei or Loc are going to double down on performance or someone else far smarter than I is going to show of their Rust/C/C++/D skills and implement a parser thats even faster than scc. I have no problem with this. It was more about seeing how fast I could make it, and besides I don't think of tools that do similar things as being in competition. Andy Lester of ack fame puts this far better than I ever could http://blog.petdance.com/2018/01/02/the-best-open-source-project-for-someone-might-not-be-yours-and-thats-ok/

Enjoy? Hate? Let me know via twitter or email directly. If like like what you read be sure to talk to the company im working at. They have far smarter and more exprienced Go developers that I am and will be happy to help. Of course if you need some help with Java or C# I can probably do something there.

