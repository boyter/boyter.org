---
title: Sloc Cloc and Code Revisited - Optimizing an already fast Go program
date: 2018-09-06
---

I don't want to make any false claims about the impact of the release of `scc` and the blog post about it https://boyter.org/posts/sloc-cloc-code/ but following its release both `tokei` and `loc` have been updated with impressive performance improvements and a new tool `polyglot` was released which also has a focus on performance.

Heck I even finished that article with the prophetic statement,

> Of course whats likely to happen now is that either the excellent authors of Tokei, Loc or Gocloc are going to double down on performance or someone else far smarter than I is going to show of their Rust/C/C++/D skills and implement a parser thats much faster than scc with duplicate detection and maybe complexity calculations. I would expect it to also be much faster than anything I could ever produce. It’s possible that Tokei and Loc could run faster already just by compiling for the specific CPU they run on or through the SIMD optimizations that at time of writing are still to hit the main-line rust compiler.

If my blog post in any way shape or form pushed forward the performance of code counters and resulted in them saving countless amounts of time around the IT industry I will consider that the highlight of my career thus far.

Of course it also means I need to revisit `scc` and see what I can do to bring `scc` back into contention on the performance front.

I figured that since I was already making changes to improve accuracy https://boyter.org/posts/sloc-cloc-code-revisited/ I would have a poke through the source and see if there were any wins to made on the performance front. However one large issue with this was that I spent a great amount of time making `scc` about as fast as I could the first time around. I seriously doubt if there are going to be too may things I know about that I missed, or new things I have discovered that I can apply this time around.

One of the really neat things about Go 1.11 that I discovered is that the web pprof view now supports flame graphs. Flame graphs for those that don't know show a base from which methods rise (or fall as the Go one is inverted) out of. The wider the base of the flame the more time is spent in that method. Taller flames indicate more method calls, where one method calls another. They give a nice visual overview of where the program is spending its time and how many calls are made.

Candidates for optimization are wide flames, ideally at the tip. As mentioned oddly enough Go's flame graphs are inverted. Here is what I started with.

![Flame Graph Start](/static/sloc-cloc-code-revisited/flame-graph-start.png)

On the far right you can see the code which walks the file tree. Next to it is the code which pulls files into memory. To the left of that is the code which processes the files. The methods which process the files take up more room. This indicates that the application is CPU bound, as that method is only invoked when the far right methods are finished, and which wholly deal with getting the files off disk into memory.

One big issue with flame graphs is that if you aren't calling out to methods it looks rather flat like the above. This can be solved by breaking large methods down into smaller ones, which will produce more tips in the flame graph.

From my previous benchmarks with `scc` I was aware that the method `complexityCount` was one of the more painful ones. At the time I managed to get it down to being about as optimal as I thought. However the brilliance of the flame graph is that it makes it easy to see where additional calls are being made and how long it spends in them.

Clicking into that method produced the following.

![Flame Graph Start](/static/sloc-cloc-code-revisited/flame-graph-interesting.png)

Interesting. Looks like there is some sort of hash table lookup and if it can be avoided it will shave 6% of the total running time of the application. The offending code is,

{{<highlight go>}}
complexityBytes := LanguageFeatures[fileJob.Language].ComplexityBytes
{{</highlight>}}

Every time the method is called it goes back to the language lookup and looks for the bytes it needs to identify complexity. This method is called a lot, almost every single byte in the file in some cases. If we look this information up once and pass it along to the method we can save potentially thousands of lookups and a lot of CPU burn time. A simple change to implement and the result looks like the below.

![Flame Graph Start](/static/sloc-cloc-code-revisited/flame-graph-after.png)

What does this translate to in the real world?

Before 

```
$ hyperfine 'scc redis'
Benchmark #1: scc redis
  Time (mean ± σ):     239.7 ms ±  43.7 ms    [User: 607.0 ms, System: 822.3 ms]
  Range (min … max):   213.0 ms … 327.5 ms
```

After

```
$ hyperfine 'scc redis'
Benchmark #1: scc redis
  Time (mean ± σ):     199.7 ms ±  26.1 ms    [User: 608.0 ms, System: 716.6 ms]
  Range (min … max):   180.5 ms … 268.8 ms
```

Not a bad saving there. Following this easy win I started poking around the code-base and identified some additional lookups and method calls that could be removed. These changes were largely a result of changing the logic to skip whitespace characters which improve accuracy.

The result of the above tweaks was that the complexity calculation inside `scc` is now calculated almost for free on small code bases and for a 10% time hit on larger ones. Trying it out on the redis code-base on a more powerful machine.

```
$ hyperfine 'scc redis'
Benchmark #1: scc ~/Projects/redis
  Time (mean ± σ):      93.2 ms ±   5.1 ms    [User: 183.4 ms, System: 398.2 ms]
  Range (min … max):    88.6 ms … 105.2 ms

$ hyperfine 'scc -c redis'
Benchmark #1: scc -c ~/Projects/redis
  Time (mean ± σ):      91.7 ms ±   5.0 ms    [User: 178.1 ms, System: 408.5 ms]
  Range (min … max):    86.9 ms … 102.7 ms
```

Only 2 ms difference between the run with complexity vs the one without when running against the redis source code. It does give an idea of just how inefficient that lookup was, and how much those additional savings helped, to the point that a 100 ms run had no real difference. I really did not expect there to be such a massive performance gain that easily.

Moving on. Another thought I had was that the core matching algorithm has a very tight nested loop like so

```
for match in start_comments:
  for char in match
    check char match 
```

Loop in a loop can be a performance problem as I found in a previous play with performance https://boyter.org/2017/03/golang-solution-faster-equivalent-java-solution/ where flattening the loop improved an algorithms performance 3x both in Java and in Go.

So I tried flattening the loop. My first candidate to try was the complexity check logic. I turned the following structure which has a nested loop over the items, and then the bytes they have in turn,

```
[
  "for ",
  "for(",
  "if ",
  "if(",
  "switch ",
  "while ",
  "else ",
  "|| ",
  "&& ",
  "!= ",
  "== "
]
```

into the following representation,

```
"for _for(_if _if(_switch _while _else _||_&&_!=_=="
```

Separated by a null byte separator (represented by _ in this case). I could then reset the state when that was hit in order to determine if we have a match or not. The loop became similar to the below.

{{<highlight go>}}
potentialMatch := true
count := 0

for i := 0; i < len(complexity); i++ {
	if complexity[i] == 0 {
		if potentialMatch {
			return count - 1
		}

		// reset stats
		count = 0
		potentialMatch = true
	}

	if index+i >= endPoint || complexity[i] != fileJob.Content[index+i] {
		potentialMatch = false
	}

	count++
}
{{</highlight>}}

The theory being that by avoiding the nested loop it should have less bookkeeping to do. We just reset the state when we hit a null byte and continue processing. I was fairly confident that this would produce a meaningful result. A quick benchmark later, with the existing method and the new one.

```
BenchmarkCheckComplexity-8   	 3000000	       466 ns/op
BenchmarkCheckComplexityNew-8   	 2000000	       699 ns/op
```

A meaningful result, but not the one I wanted. Turns out that at this small level of nested looping there is no performance to be gained here. In fact in this case the opposite occurred and it actually ran slower. This was especially annoying because any gains here would have really helped speed up all of the hot methods.

Another thought was to do what the complexity check does and build a small list of the first bytes for each lookup and then loop that to see if we should process any further. As mentioned the complexity check does this and as such it was a fairly simple thing to add, since similar code already existed. Another benchmark later.

```
github.com/boyter/scc/processor.checkForMatchMultiOpen (15.15%, 0.75s) "with byte check"
github.com/boyter/scc/processor.checkForMatchMultiOpen (12.97%, 0.62s) "without byte check"
```

Alas because the number of bytes to check here is generally too small to make it worthwhile, it ends up doing more work as a result and this does not save any time, and in fact slows down the processing.

At this point I was running out of ideas.

I decided I would have a look at changing the order of the if statements in the different state cases. Due to how they had a bailout condition ideally you want to hit the most common ones first in order to trigger these conditions and avoid additional processing. Note that this is a serious micro optimization. It only makes sense to even consider something like this because the application runs in a very tight loop.

I started tweaking the order of the if conditions in the process blank state. The results were rather surprising.

```
$ hyperfine -m 50 'scc cpython'
Benchmark #1: scc cpython
  Time (mean ± σ):     551.7 ms ±  22.5 ms    [User: 1.936 s, System: 1.737 s]
  Range (min … max):   525.1 ms … 636.3 ms

$ hyperfine -m 50 'scc cpython'
Benchmark #1: scc cpython
  Time (mean ± σ):     544.9 ms ±  23.4 ms    [User: 1.904 s, System: 1.808 s]
  Range (min … max):   524.3 ms … 614.6 ms

$ hyperfine -m 50 'scc cpython'
Benchmark #1: scc cpython
  Time (mean ± σ):     536.6 ms ±  10.2 ms    [User: 1.933 s, System: 1.754 s]
  Range (min … max):   516.5 ms … 574.7 ms
```

I set hyperfine to run 50 times to try and remove any noise from the results and converge on a result. As you can see from the above changing the if conditions on such a tight loop can actually improve performance quite a bit. In this case the time to process ended up taking 15 ms less than before for the best order of the statements I found.

With the blank state sorted I made the change permanent and had a look at the other conditions, starting with multi-line comments.

```
$ hyperfine -m 50 'scc cpython'
Benchmark #1: scc cpython
  Time (mean ± σ):     527.1 ms ±   9.5 ms    [User: 1.899 s, System: 1.793 s]
  Range (min … max):   502.6 ms … 577.8 ms

$ hyperfine -m 50 'scc cpython'
Benchmark #1: scc cpython
  Time (mean ± σ):     540.6 ms ±  20.0 ms    [User: 1.936 s, System: 1.825 s]
  Range (min … max):   515.4 ms … 607.9 ms
```

Another small gain of almost 10 ms from re-ordering the if statements. I then moved to the last state that has any if conditionals which was the code state. This state is where the application spends most of its time so any wins here are likely to yield the biggest benefits.

```
Benchmark #1: scc cpython
  Time (mean ± σ):     522.9 ms ±   9.3 ms    [User: 1.890 s, System: 1.740 s]
  Range (min … max):   510.1 ms … 577.7 ms

$ hyperfine -m 50 'scc cpython'
Benchmark #1: scc cpython
  Time (mean ± σ):     491.0 ms ±  10.2 ms    [User: 1.628 s, System: 1.763 s]
  Range (min … max):   476.3 ms … 539.5 ms
```

Since this is where the application spends most of its time it does indeed give the biggest gain with about 30 ms of time shaved from the previous result. 

The final result of reordering the if statements? About 50 ms of processing time for the repository I chose which is almost a 10% processing time saving. For messing around with the order of if statements this is a pretty big win.

The last idea I had to improve performance involved rethinking the problem. We know ahead of time which characters could cause a state change as we know which strings would cause a state change. If the character we are currently processing is the same as the first character of one of those strings then we know we need to continue to check if the state will change. However if it does not match then we can skip any conditional state change logic and just move to the next byte. 

In short instead of looking for positive matches assuming they may be there, check quickly if there might be one and if not move on. This is similar to the complexity check logic I had previously added which improved performance by speeding up the best best case at the expense of selling out the worst case.

Logically this makes sense. After all we spend most of the loop not moving between states. So why bother checking if we should move state and instead check if we shouldn't? In theory it should be less processing. Even if we only do this check inside the check code state there is potentially a massive gain here.

Mercifully this was a quick thing to implement as it is very similar to the complexity check shortcut that is already in the code-base.

```
$ hyperfine -m 50 'scc cpython'
Benchmark #1: scc cpython
  Time (mean ± σ):     535.3 ms ±   8.0 ms    [User: 1.974 s, System: 1.751 s]
  Range (min … max):   525.1 ms … 575.6 ms

$ hyperfine -m 50 'scc cpython'
Benchmark #1: scc cpython
  Time (mean ± σ):     461.6 ms ±  11.0 ms    [User: 1.310 s, System: 1.890 s]
  Range (min … max):   445.3 ms … 519.8 ms
```

The result is not a bad one at all. In fact this was a very large performance gain vs the amount of work required.

I then started thinking about the problem some more. 

The application as written has a main loop which processes over every byte in the file. It keeps track of the state it is in and uses a switch over that state to know what processing should happen. I was wonder if rather than having a large single loop over the whole byte array, what if when we entered a new state we drifted into a new loop which processed bytes until the state changed? IE rather than loop and check the state, change state and then loop. Would this be faster?

This is a rather large change to implement but because it totally changes how the core loop works it might produce the best speed boost. For a start it would mean that the loops would be much shorter which increases the chance that the loop hits the lower level CPU caches.






One annoying thing that comes out of the very tight benchmarks posted is that scc spends a non trivial amount of time parsing the JSON it uses for language features. For example over a few runs with the trace logging enabled I recorded the following,

```
TRACE 2018-09-05T22:20:40Z: milliseconds unmarshal: 11
TRACE 2018-09-05T22:20:40Z: milliseconds build language features: 1

TRACE 2018-09-08T04:34:28Z: milliseconds unmarshal: 5
TRACE 2018-09-08T04:34:28Z: milliseconds build language features: 2

TRACE 2018-09-08T04:35:58Z: milliseconds unmarshal: 3
TRACE 2018-09-08T04:35:58Z: milliseconds build language features: 2

TRACE 2018-09-08T04:36:48Z: milliseconds unmarshal: 14
TRACE 2018-09-08T04:36:48Z: milliseconds build language features: 3
```

That is ~10 milliseconds spent every time it is called just getting ready to parse. The most annoying part is that it gets worse with slower CPU's or if you CPU is being throttled for some reason.

The entire step can actually be removed into a pre-process step of `go generate` and shave the time of every call to `scc` by a few milliseconds for each run.

Of course this means a non trivial change to how the task in `go generate` works, but I think the result is probably worth it.




### Benchmarks

All GNU/Linux tests were run on Digital Ocean 16 vCPU Compute optimized droplet with 32 GB of RAM and a 200 GB SSD. The machine used was doing nothing else at the time and was created with the sole purpose of running the tests to ensure no interference from other processes. The OS used is Ubuntu 18.04 and the rust programs were installed using cargo install.

The Windows tests were run on a Surface Book 2 with the i7-8650U CPU. This is problematic as there is the possibility that CPU throttling will kick in influencing the benchmark, and as it is not a freshly formatted machine that there may be something else running on it during the benchmark. Take these tests with a massive grain of salt and treat them as more an indication of performance than a perfect benchmark. I did my best to stop all background services and ran benchmarks several times only taking the best result for each to try and keep it as fair as possible. I ran the tests inside the Ubuntu WSL which means I was running Linux binaries in Windows which probably causes odd results as well.

With that out of the way time for the usual benchmarks. Similar to the comparison by `tokei` https://github.com/Aaronepower/tokei/blob/master/COMPARISON.md I have included a few tools, `tokei`, `cloc`, `scc`, `loc` and `polyglot`.

Tools under test

 - scc 1.9.0
 - tokei 8.0.1
 - loc 0.4.1
 - polyglot 0.5.10

I compiled `tokei` and `loc` on the machine used for testing using the latest version of Rust 1.28.

I am not going to include any commentary about the benchmarks. 

To start lets try the accuracy test using the `tokei` torture test file.

```
root@ubuntu-c-16-sgp1-01:~# ./scc tokeitest/
-------------------------------------------------------------------------------
Language                 Files     Lines     Code  Comments   Blanks Complexity
-------------------------------------------------------------------------------
Rust                         1        39       32         2        5          5
-------------------------------------------------------------------------------
Total                        1        39       32         2        5          5
-------------------------------------------------------------------------------

root@ubuntu-c-16-sgp1-01:~# tokei tokeitest/
--------------------------------------------------------------------------------
 Language             Files        Lines         Code     Comments       Blanks
--------------------------------------------------------------------------------
 Rust                     1           38           32            2            4
--------------------------------------------------------------------------------
 Total                    1           38           32            2            4
--------------------------------------------------------------------------------

root@ubuntu-c-16-sgp1-01:~# loc tokeitest/
--------------------------------------------------------------------------------
 Language             Files        Lines        Blank      Comment         Code
--------------------------------------------------------------------------------
 Rust                     1           39            5           34            0
--------------------------------------------------------------------------------
 Total                    1           39            5           34            0
--------------------------------------------------------------------------------

root@ubuntu-c-16-sgp1-01:~# cloc tokeitest/
github.com/AlDanial/cloc v 1.74  T=0.01 s (127.5 files/s, 4974.4 lines/s)
-------------------------------------------------------------------------------
Language                     files          blank        comment           code
-------------------------------------------------------------------------------
Rust                             1              5             10             24
-------------------------------------------------------------------------------

root@ubuntu-c-16-sgp1-01:~# ./polyglot tokeitest/
-------------------------------------------------------------------------------
 Language             Files       Lines         Code     Comments       Blanks
-------------------------------------------------------------------------------
 Rust                     1          39           34            0            5
-------------------------------------------------------------------------------
 Total                    1          39           34            0            5
-------------------------------------------------------------------------------
```

As you can see both `tokei` and `scc` get the numbers correct. The other tools have varying degrees of success.

#### Cython f3267144269b873bcb87a9fcafe94b37be1bcfdc

```
root@ubuntu-c-16-sgp1-01:~# hyperfine './scc cpython' && hyperfine 'GOGC=-1 ./scc -c cpython' && hyperfine 'tokei cpython' && hyperfine 'loc cpython' && hyperfine './polyglot cpython'
Benchmark #1: ./scc cpython
  Time (mean ± σ):     170.1 ms ±   5.1 ms    [User: 1.925 s, System: 0.093 s]
  Range (min … max):   163.9 ms … 182.8 ms

Benchmark #1: GOGC=-1 ./scc -c cpython
  Time (mean ± σ):     136.5 ms ±   3.3 ms    [User: 1.529 s, System: 0.099 s]
  Range (min … max):   130.5 ms … 142.5 ms

Benchmark #1: tokei cpython
  Time (mean ± σ):      82.6 ms ±   5.0 ms    [User: 710.1 ms, System: 80.0 ms]
  Range (min … max):    75.0 ms …  91.9 ms

Benchmark #1: loc cpython
  Time (mean ± σ):      62.0 ms ±  12.7 ms    [User: 695.6 ms, System: 72.1 ms]
  Range (min … max):    48.2 ms …  97.7 ms

Benchmark #1: ./polyglot cpython
  Time (mean ± σ):      76.6 ms ±   5.1 ms    [User: 117.7 ms, System: 83.3 ms]
  Range (min … max):    63.3 ms …  86.5 ms



root@ubuntu-c-16-sgp1-01:~# hyperfine './scc redis' && hyperfine 'GOGC=-1 ./scc -c redis' && hyperfine 'tokei redis' && hyperfine 'loc redis' && hyperfine './polyglot redis'
Benchmark #1: ./scc redis
  Time (mean ± σ):      25.3 ms ±   2.1 ms    [User: 198.4 ms, System: 16.7 ms]
  Range (min … max):    22.9 ms …  33.5 ms

Benchmark #1: GOGC=-1 ./scc -c redis
  Time (mean ± σ):      23.0 ms ±   2.3 ms    [User: 159.0 ms, System: 18.1 ms]
  Range (min … max):    20.1 ms …  31.2 ms

Benchmark #1: tokei redis
  Time (mean ± σ):      20.4 ms ±   2.4 ms    [User: 91.9 ms, System: 21.6 ms]
  Range (min … max):    17.0 ms …  29.9 ms

Benchmark #1: loc redis
  Time (mean ± σ):      19.6 ms ±   8.7 ms    [User: 138.1 ms, System: 13.6 ms]
  Range (min … max):    13.2 ms …  70.8 ms

  Warning: Statistical outliers were detected. Consider re-running this benchmark on a quiet PC without any interferences from other programs. It might help to use the '--warmup' or '--prepare' options.

Benchmark #1: ./polyglot redis
  Time (mean ± σ):      16.0 ms ±   0.9 ms    [User: 16.4 ms, System: 18.0 ms]
  Range (min … max):    14.0 ms …  22.1 ms


root@ubuntu-c-16-sgp1-01:~# hyperfine './scc rust' && hyperfine 'GOGC=-1 ./scc -c rust' && hyperfine 'tokei rust' && hyperfine 'loc rust' && hyperfine './polyglot rust'
Benchmark #1: ./scc rust
  Time (mean ± σ):     129.9 ms ±   2.5 ms    [User: 977.2 ms, System: 161.8 ms]
  Range (min … max):   127.2 ms … 137.0 ms

Benchmark #1: GOGC=-1 ./scc -c rust
  Time (mean ± σ):     118.9 ms ±   2.2 ms    [User: 807.1 ms, System: 163.4 ms]
  Range (min … max):   115.4 ms … 124.5 ms

Benchmark #1: tokei rust
  Time (mean ± σ):     112.2 ms ±   5.6 ms    [User: 609.6 ms, System: 146.8 ms]
  Range (min … max):   105.6 ms … 124.8 ms

Benchmark #1: loc rust
  Time (mean ± σ):     141.0 ms ±  34.1 ms    [User: 1.964 s, System: 0.123 s]
  Range (min … max):   116.1 ms … 215.5 ms

Benchmark #1: ./polyglot rust
  Time (mean ± σ):     122.6 ms ±   4.0 ms    [User: 214.3 ms, System: 152.5 ms]
  Range (min … max):   115.5 ms … 130.9 ms


root@ubuntu-c-16-sgp1-01:~# hyperfine './scc linux' && hyperfine 'GOGC=-1 ./scc -c linux' && hyperfine 'tokei linux' && hyperfine 'loc linux' && hyperfine './polyglot linux'
Benchmark #1: ./scc linux
  Time (mean ± σ):      2.312 s ±  0.131 s    [User: 28.127 s, System: 0.900 s]
  Range (min … max):    2.134 s …  2.547 s

Benchmark #1: GOGC=-1 ./scc -c linux
  Time (mean ± σ):      1.538 s ±  0.013 s    [User: 21.671 s, System: 1.180 s]
  Range (min … max):    1.523 s …  1.561 s

Benchmark #1: tokei linux
  Time (mean ± σ):     884.6 ms ±  33.5 ms    [User: 9.506 s, System: 0.850 s]
  Range (min … max):   845.4 ms … 936.9 ms

Benchmark #1: loc linux
  Time (mean ± σ):     654.8 ms ±   6.8 ms    [User: 9.085 s, System: 0.813 s]
  Range (min … max):   646.6 ms … 664.9 ms

Benchmark #1: ./polyglot linux
  Time (mean ± σ):     999.5 ms ±  35.0 ms    [User: 2.378 s, System: 0.816 s]
  Range (min … max):   943.9 ms … 1041.8 ms
```

```
root@ubuntu-c-16-sgp1-01:~# hyperfine './scc linux' && hyperfine './scc -c linux' && hyperfine 'GOGC=-1 ./scc -c linux' && hyperfine 'tokei linux' && hyperfine 'loc linux' && hyperfine './polyglot linux' && hyperfine './scc1.10 linux' &&
 hyperfine './scc1.10 -c linux' && hyperfine 'GOGC=-1 ./scc1.10 -c linux'
Benchmark #1: ./scc linux

  Time (mean ± σ):      2.343 s ±  0.097 s    [User: 27.740 s, System: 0.868 s]

  Range (min … max):    2.187 s …  2.509 s

Benchmark #1: ./scc -c linux

  Time (mean ± σ):      1.859 s ±  0.087 s    [User: 22.369 s, System: 0.845 s]

  Range (min … max):    1.720 s …  1.955 s

Benchmark #1: GOGC=-1 ./scc -c linux

  Time (mean ± σ):      1.529 s ±  0.009 s    [User: 21.616 s, System: 1.090 s]

  Range (min … max):    1.517 s …  1.547 s

Benchmark #1: tokei linux

  Time (mean ± σ):     849.2 ms ±  31.9 ms    [User: 9.264 s, System: 0.808 s]

  Range (min … max):   819.6 ms … 899.2 ms

Benchmark #1: loc linux

  Time (mean ± σ):     671.1 ms ±  38.2 ms    [User: 9.362 s, System: 0.849 s]

  Range (min … max):   645.0 ms … 775.5 ms

Benchmark #1: ./polyglot linux

  Time (mean ± σ):      1.044 s ±  0.056 s    [User: 2.610 s, System: 0.812 s]

  Range (min … max):    0.956 s …  1.122 s

Benchmark #1: ./scc1.10 linux

  Time (mean ± σ):      1.392 s ±  0.019 s    [User: 19.415 s, System: 0.825 s]

  Range (min … max):    1.367 s …  1.430 s

Benchmark #1: ./scc1.10 -c linux

  Time (mean ± σ):      1.280 s ±  0.022 s    [User: 17.477 s, System: 0.843 s]

  Range (min … max):    1.247 s …  1.314 s

Benchmark #1: GOGC=-1 ./scc1.10 -c linux

  Time (mean ± σ):      1.175 s ±  0.006 s    [User: 16.321 s, System: 1.168 s]

  Range (min … max):    1.167 s …  1.185 s

```

https://www.reddit.com/r/rust/comments/9aa6t8/tokei_v800_language_filtering_dynamic_term_width/
https://www.reddit.com/r/rust/comments/99e4tq/reading_files_quickly_in_rust/
https://github.com/Aaronepower/tokei/blob/master/COMPARISON.md