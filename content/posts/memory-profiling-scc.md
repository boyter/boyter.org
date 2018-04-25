---
title: ''
date: 2028-04-16
---

Switch over to use `github.com/pkg/profile` and then `defer profile.Start(profile.MemProfile).Stop()` at the start

all over commands work as expected

![Memory Profile](/static/memory-profiling-scc/profile_start.png)

```
(pprof) top20
Showing nodes accounting for 572.44kB, 96.61% of 592.52kB total
Showing top 20 nodes out of 96
      flat  flat%   sum%        cum   cum%
  192.44kB 32.48% 32.48%   192.44kB 32.48%  bytes.makeSlice
  148.91kB 25.13% 57.61%   160.93kB 27.16%  github.com/boyter/scc/processor.processConstants
      64kB 10.80% 68.41%   119.21kB 20.12%  github.com/boyter/scc/vendor/github.com/karrick/godirwalk.Walk
   34.56kB  5.83% 74.24%    34.56kB  5.83%  os.newFile
   25.14kB  4.24% 78.49%    25.14kB  4.24%  runtime.malg
   18.59kB  3.14% 81.62%    18.59kB  3.14%  internal/poll.(*FD).writeConsole
   12.26kB  2.07% 83.69%    34.64kB  5.85%  github.com/boyter/scc/processor.walkDirectoryParallel.func1.1
   10.33kB  1.74% 85.44%    10.33kB  1.74%  sync.(*Map).Store
    8.21kB  1.39% 86.82%     8.21kB  1.39%  github.com/boyter/scc/processor.fileSummerizeShort
    8.06kB  1.36% 88.18%     8.06kB  1.36%  strings.Join
    8.02kB  1.35% 89.54%     8.02kB  1.35%  reflect.cvtBytesString
       8kB  1.35% 90.89%        8kB  1.35%  time.initLocalFromTZI
    4.73kB   0.8% 91.69%     4.73kB   0.8%  fmt.(*buffer).WriteString
    4.52kB  0.76% 92.45%     8.71kB  1.47%  runtime.allocm
    4.32kB  0.73% 93.18%     8.48kB  1.43%  os.openDir
    4.16kB   0.7% 93.88%     4.16kB   0.7%  unicode/utf16.Decode
    4.05kB  0.68% 94.56%     4.05kB  0.68%  crypto/md5.New
    4.05kB  0.68% 95.25%     4.05kB  0.68%  github.com/boyter/scc/vendor/github.com/monochromegane/go-gitignore.(*initialPatterns).set
    4.05kB  0.68% 95.93%     4.05kB  0.68%  os.(*File).Stat
    4.05kB  0.68% 96.61%     8.06kB  1.36%  os.(*File).readdir
```