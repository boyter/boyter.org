---
title: ''
date: ''
---

### Performance

I figured that since I was already making changes I would have a poke through the source and see if there were any wins to made on the performance front.

One of the really neat things about Go 1.11 that I discovered is that the web pprof view now supports flame graphs. Flame graphs for those that don't know show a base from which methods rise (or fall as the Go one is inverted) out of. The wider the base of the flame the more time is spent in that method. Taller flames indicate more method calls, where one method calls another. They give a nice visual overview of where the program is spending its time and how many calls are made.

Candidates for optimisation are wide flames, ideally at the tip. As mentioned oddly enough Go's flame graphs are inverted. Here is what I started with.

![Flame Graph Start](/static/sloc-cloc-code-revisited/flame-graph-start.png)

On the far right you can see the code which walks the file tree. Next to it is the code which pulls files into memory. To the left of that is the code which processes the files. The methods which process the files take up more room. This indicates that the application is CPU bound, as that method is only invoked when the far right methods are finished.

One big issue with flame graphs is that if you arent calling out to methods it looks rather flat like the above. This can be solved by breaking large methods down into smaller ones, which will produce more tips in the flame graph.

From my previous benchmarks with `scc` I was aware that the method `complexityCount` was one of the more painful ones. At the time I managed to get it down to being about as optimial as I thought. However the brilliance of the flame graph is that it makes it easy to see where addtional calls are being made and how long it spends in them.

Clicking into that method produced the following.

![Flame Graph Start](/static/sloc-cloc-code-revisited/flame-graph-interesting.png)

Interesting. Looks like there is some sort of hash table lookup and if it can be avoided it will shave 6% of the total running time of the application. The offending code is,

{{<highlight go>}}
complexityBytes := LanguageFeatures[fileJob.Language].ComplexityBytes
{{</highlight>}}

Every time the method is called it goes back to the language lookup and looks for the bytes it needs to identify complexity. This method is called a lot, almost every single byte in the file in some cases. If we look this information up once and pass it along to the method we can save porentially thousands of lookups and a lot of CPU burn time. A simple change to implement and the result looks like the below.

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

Not a bad saving there. Following this easy win I started poking around the codebase and identified some additional lookups and method calls that could be removed. These changes were largly a result of changing the logic to skip whitespace characters which improve accuracy.

The result of the above tweaks was that the complexity calculation inside `scc` is now calculated almost for free. Trying it out on the redis codebase on a more powerful machine.

```
$ hyperfine 'scc redis' && hyperfine 'scc -c redis'
Benchmark #1: scc redis
  Time (mean ± σ):      96.5 ms ±   3.5 ms    [User: 271.4 ms, System: 321.2 ms]
  Range (min … max):    92.4 ms … 105.7 ms

Benchmark #1: scc -c redis
  Time (mean ± σ):      91.1 ms ±   2.7 ms    [User: 193.5 ms, System: 362.1 ms]
  Range (min … max):    87.4 ms …  96.6 ms
```

Only 5ms difference between the run with complexity vs the one without when running against the redis source code. Oddly for some reason the complexity calcuation is faster but this is a very synthetic benchmark. It does give an idea of just how inefficient that lookup was, and how much those addtional savings helped.


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


https://www.reddit.com/r/rust/comments/9aa6t8/tokei_v800_language_filtering_dynamic_term_width/
https://www.reddit.com/r/rust/comments/99e4tq/reading_files_quickly_in_rust/
https://github.com/Aaronepower/tokei/blob/master/COMPARISON.md