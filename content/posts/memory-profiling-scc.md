---
title: Memory Profiling Sloc Cloc and Code - The goal to outperfom Tokei
date: 2098-04-25
---

<https://blog.golang.org/profiling-go-programs>

Switch over to use `github.com/pkg/profile` and then `defer profile.Start(profile.MemProfile).Stop()` at the start

all over commands work as expected

![Memory Profile](/static/memory-profiling-scc/profile_start.png)```
(pprof) top20
Showing nodes accounting for 821.33kB, 97.59% of 841.58kB total
Dropped 10 nodes (cum <= 4.21kB)
Showing top 20 nodes out of 76
      flat  flat%   sum%        cum   cum%
  255.66kB 30.38% 30.38%   255.66kB 30.38%  bytes.makeSlice
  120.43kB 14.31% 44.69%   128.61kB 15.28%  github.com/boyter/scc/processor.processConstants
   85.81kB 10.20% 54.88%   192.44kB 22.87%  github.com/boyter/scc/processor.walkDirectoryParallel.func1.1
      64kB  7.60% 62.49%   330.57kB 39.28%  github.com/boyter/scc/vendor/github.com/karrick/godirwalk.Walk
   58.66kB  6.97% 69.46%    58.66kB  6.97%  runtime.malg
   58.49kB  6.95% 76.41%    86.52kB 10.28%  sync.(*Map).Store
   40.40kB  4.80% 81.21%    40.40kB  4.80%  strings.Join
   28.03kB  3.33% 84.54%    28.03kB  3.33%  sync.(*Map).dirtyLocked
   18.31kB  2.18% 86.72%    18.31kB  2.18%  github.com/boyter/scc/processor.fileSummerizeShort
   12.42kB  1.48% 88.19%    20.57kB  2.44%  syscall.UTF16FromString
   12.03kB  1.43% 89.62%    16.05kB  1.91%  syscall.UTF16ToString
   12.02kB  1.43% 91.05%    98.54kB 11.71%  github.com/boyter/scc/processor.getExtension
    8.99kB  1.07% 92.12%    25.04kB  2.98%  os.(*File).readdir
    8.64kB  1.03% 93.14%    12.76kB  1.52%  os.openDir
    8.40kB     1% 94.14%     8.40kB     1%  github.com/boyter/scc/vendor/github.com/monochromegane/go-gitignore.(*patterns).add
    8.16kB  0.97% 95.11%     8.16kB  0.97%  unicode/utf16.Encode
       8kB  0.95% 96.06%        8kB  0.95%  time.initLocalFromTZI
    4.52kB  0.54% 96.60%     8.71kB  1.03%  runtime.allocm
    4.32kB  0.51% 97.11%     4.32kB  0.51%  os.newFile
    4.05kB  0.48% 97.59%   259.71kB 30.86%  io/ioutil.readAll

``````
(pprof) list github.com/boyter/scc/processor.processConstants
Total: 841.58kB
ROUTINE ======================== github.com/boyter/scc/processor.processConstants in C:\Users\bboyter\Documents\Go\src\github.com\boyter\scc\processor\processor.go
  120.43kB   128.61kB (flat, cum) 15.28% of Total
         .          .     38:// Needs to be called at least once in order for anything to actually happen
         .          .     39:func processConstants() {
         .          .     40:   var database map[string]Language
         .          .     41:   startTime := makeTimestampMilli()
         .          .     42:   data, _ := base64.StdEncoding.DecodeString(languages)
         .     8.18kB     43:   json.Unmarshal(data, &database)
         .          .     44:
         .          .     45:   if Trace {
         .          .     46:           printTrace(fmt.Sprintf("milliseconds unmarshal: %d", makeTimestampMilli()-startTime))
         .          .     47:   }
         .          .     48:
         .          .     49:   startTime = makeTimestampNano()
         .          .     50:   for name, value := range database {
         .          .     51:           for _, ext := range value.Extensions {
   18.80kB    18.80kB     52:                   ExtensionToLanguage[ext] = name
         .          .     53:           }
         .          .     54:   }
         .          .     55:
         .          .     56:   if Trace {
         .          .     57:           printTrace(fmt.Sprintf("nanoseconds build extension to language: %d", makeTimestampNano()-startTime))
         .          .     58:   }
         .          .     59:
         .          .     60:   startTime = makeTimestampMilli()
         .          .     61:   for name, value := range database {
         .          .     62:           complexityBytes := []byte{}
         .          .     63:           complexityChecks := [][]byte{}
         .          .     64:           singleLineComment := [][]byte{}
         .          .     65:           multiLineComment := []OpenClose{}
         .          .     66:           stringChecks := []OpenClose{}
         .          .     67:
         .          .     68:           for _, v := range value.ComplexityChecks {
    4.01kB     4.01kB     69:                   complexityBytes = append(complexityBytes, v[0])
   37.53kB    37.53kB     70:                   complexityChecks = append(complexityChecks, []byte(v))
         .          .     71:           }
         .          .     72:
         .          .     73:           for _, v := range value.LineComment {
    8.03kB     8.03kB     74:                   singleLineComment = append(singleLineComment, []byte(v))
         .          .     75:           }
         .          .     76:
         .          .     77:           for _, v := range value.MultiLine {
    4.02kB     4.02kB     78:                   multiLineComment = append(multiLineComment, OpenClose{
         .          .     79:                           Open:  []byte(v[0]),
         .          .     80:                           Close: []byte(v[1]),
         .          .     81:                   })
         .          .     82:           }
         .          .     83:
         .          .     84:           for _, v := range value.Quotes {
    4.02kB     4.02kB     85:                   stringChecks = append(stringChecks, OpenClose{
    4.01kB     4.01kB     86:                           Open:  []byte(v[0]),
         .          .     87:                           Close: []byte(v[1]),
         .          .     88:                   })
         .          .     89:           }
         .          .     90:
      40kB       40kB     91:           LanguageFeatures[name] = LanguageFeature{
         .          .     92:                   ComplexityBytes:   complexityBytes,
         .          .     93:                   ComplexityChecks:  complexityChecks,
         .          .     94:                   MultiLineComment:  multiLineComment,
         .          .     95:                   SingleLineComment: singleLineComment,
         .          .     96:                   StringChecks:      stringChecks,
```

Looking at inuse objects

    go tool pprof --inuse_objects```
(pprof) top20
Showing nodes accounting for 5849, 99.59% of 5873 total
Dropped 23 nodes (cum <= 29)
Showing top 20 nodes out of 63
      flat  flat%   sum%        cum   cum%
      1286 21.90% 21.90%       1554 26.46%  github.com/boyter/scc/processor.processConstants
      1027 17.49% 39.38%       1028 17.50%  sync.(*Map).Store
       768 13.08% 52.46%       1796 30.58%  github.com/boyter/scc/processor.getExtension
       640 10.90% 63.36%        725 12.34%  syscall.UTF16ToString
       518  8.82% 72.18%        518  8.82%  strings.Join
       498  8.48% 80.66%       2388 40.66%  github.com/boyter/scc/processor.walkDirectoryParallel.func1.1
       256  4.36% 85.02%        256  4.36%  encoding/json.unquoteBytes
       156  2.66% 87.67%        156  2.66%  runtime.malg
       148  2.52% 90.19%        148  2.52%  github.com/boyter/scc/processor.fileSummerizeShort
       128  2.18% 92.37%        927 15.78%  github.com/boyter/scc/vendor/github.com/karrick/godirwalk.readdirents
        85  1.45% 93.82%         85  1.45%  github.com/boyter/scc/vendor/github.com/monochromegane/go-gitignore.newDepthPatternHolder
        85  1.45% 95.27%         85  1.45%  unicode/utf16.Decode
        51  0.87% 96.13%         51  0.87%  unicode/utf16.Encode
        45  0.77% 96.90%        770 13.11%  os.(*File).readdir
        44  0.75% 97.65%         95  1.62%  syscall.UTF16FromString
        37  0.63% 98.28%         69  1.17%  io/ioutil.readAll
        32  0.54% 98.83%         32  0.54%  bytes.makeSlice
        32  0.54% 99.37%         32  0.54%  github.com/boyter/scc/vendor/github.com/monochromegane/go-gitignore.(*patterns).add
        12   0.2% 99.57%         29  0.49%  os.openDir
         1 0.017% 99.59%       3740 63.68%  github.com/boyter/scc/vendor/github.com/karrick/godirwalk.Walk
``````

(pprof) list github.com/boyter/scc/processor.processConstants
Total: 5873
ROUTINE ======================== github.com/boyter/scc/processor.processConstants in C:\Users\bboyter\Documents\Go\src\github.com\boyter\scc\processor\processor.go
      1286       1554 (flat, cum) 26.46% of Total
         .          .     38:// Needs to be called at least once in order for anything to actually happen
         .          .     39:func processConstants() {
         .          .     40:   var database map[string]Language
         .          .     41:   startTime := makeTimestampMilli()
         .          .     42:   data, _:= base64.StdEncoding.DecodeString(languages)
         .        268     43:   json.Unmarshal(data, &database)
         .          .     44:
         .          .     45:   if Trace {
         .          .     46:           printTrace(fmt.Sprintf("milliseconds unmarshal: %d", makeTimestampMilli()-startTime))
         .          .     47:   }
         .          .     48:
         .          .     49:   startTime = makeTimestampNano()
         .          .     50:   for name, value := range database {
         .          .     51:           for_, ext := range value.Extensions {
         1          1     52:                   ExtensionToLanguage[ext] = name
         .          .     53:           }
         .          .     54:   }
         .          .     55:
         .          .     56:   if Trace {
         .          .     57:           printTrace(fmt.Sprintf("nanoseconds build extension to language: %d", makeTimestampNano()-startTime))
         .          .     58:   }
         .          .     59:
         .          .     60:   startTime = makeTimestampMilli()
         .          .     61:   for name, value := range database {
         .          .     62:           complexityBytes := []byte{}
         .          .     63:           complexityChecks := [][]byte{}
         .          .     64:           singleLineComment := [][]byte{}
         .          .     65:           multiLineComment := []OpenClose{}
         .          .     66:           stringChecks := []OpenClose{}
         .          .     67:
         .          .     68:           for _, v := range value.ComplexityChecks {
       256        256     69:                   complexityBytes = append(complexityBytes, v[0])
       345        345     70:                   complexityChecks = append(complexityChecks, []byte(v))
         .          .     71:           }
         .          .     72:
         .          .     73:           for_, v := range value.LineComment {
       257        257     74:                   singleLineComment = append(singleLineComment, []byte(v))
         .          .     75:           }
         .          .     76:
         .          .     77:           for _, v := range value.MultiLine {
        85         85     78:                   multiLineComment = append(multiLineComment, OpenClose{
         .          .     79:                           Open:  []byte(v[0]),
         .          .     80:                           Close: []byte(v[1]),
         .          .     81:                   })
         .          .     82:           }
         .          .     83:
         .          .     84:           for_, v := range value.Quotes {
        85         85     85:                   stringChecks = append(stringChecks, OpenClose{
       256        256     86:                           Open:  []byte(v[0]),
         .          .     87:                           Close: []byte(v[1]),
         .          .     88:                   })
         .          .     89:           }
         .          .     90:
         1          1     91:           LanguageFeatures[name] = LanguageFeature{
         .          .     92:                   ComplexityBytes:   complexityBytes,
         .          .     93:                   ComplexityChecks:  complexityChecks,
         .          .     94:                   MultiLineComment:  multiLineComment,
         .          .     95:                   SingleLineComment: singleLineComment,
         .          .     96:                   StringChecks:      stringChecks,

```

The above is all wrong. It only becomes apparent because the repository tested was so small.
