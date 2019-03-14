---
title: My Personal Complaints about Programming in Golang 
date: 2019-03-14
---

Go as a language is fairly decent. However because it tends to come up often enough on the company slack programming channel (see what I did there?) I figured id articulate it better here so I can just point people at it when they ask what my complaints are. 

For the record I have been using it heavily for the last or so, writing command line applications, [scc](https://github.com/boyter/scc/) [lc](https://github.com/boyter/lc/) and API's from large scale ones for clients to [syntax highlighers](https://github.com/boyter/searchcode-server-highlighter).

My crisitisms are not aimed exclusively at Go. I have complaints about every language I use. In fact the below quote is extremely applicable here.

> "There are only two kinds of languages: the ones people complain about and the ones nobody uses.". - Bjarne Stroustrup,

### #1 The lack of functional programming

This is probably my biggest pain point with Go. Going against the crowd I don't want generics, which I think would just add unnesscary complexity to most Go projects. What I want is some functional methods applied over the in-built slice and map in Go. Both of those types are already magic in the sense that they can hold any type.

For example consider the below. 

Given two slices of strings work out which ones exist in both and put it this into a new slice so we can process it later.

{{<highlight go>}}
existsBoth := []string{}
for _, first := range firstSlice {
	inBoth := false

	for _, second := range secondSlice {
		if first == second {
			inBoth = true
		}
	}

	if inBoth {
		existsBoth = append(existsBoth, proxy)
	}
}
{{</highlight>}}

The above is one trivial way to solve this in Go. Lets compare it to the same logic in Java.

{{<highlight java>}}
var existsBoth = firstList.stream()
                .filter(x -> secondList.contains(x))
                .collect(Collectors.toList());
{{</highlight>}}

Now the above does hide the algorithmic complexity of whats happening, but its far simpler to see what its actually doing. The intent of the code is obvious compared to the Go code its imitating. However whats even better about it is that adding addtional filters is trivial, so to do whats below we would need to add two more if conditions into the already nested for loops to achive this.

{{<highlight java>}}
var existsBoth = firstList.stream()
                .filter(x -> secondList.contains(x))
                .filter(x -> x.startsWith(needle))
                .filter(x -> x.length() >= 5)
                .collect(Collectors.toList());
{{</highlight>}}

There are projects which using `go generate` can achive some of the above for you, but without nice IDE support its clunky and more of a hassle over pulling out the loop above into its own method.

### #2 Channels

Go channels are generally pretty great. They have some issues where you can easily block forever, but they arent about providing fearless concurrency. For reading files off a disk and throwing them down the line for processing they are great. What they are not so good for is processing slices.

Its pretty common in pretty much every other language that when you have a large list or slice you use parallel streams, parallel linq, rayon or multiprocessing to iterate over that list using all available CPU's. You apply them over your list and get back a list of processed elements.

However in Go its not obvious what you need to do to achieve something similar.

One possible solution is to spawn a Go routine for each item in your slice. Because of the low overhead of Goroutines this is a valid strategy, to a point.

{{<highlight go>}}
toProcess := []int{1,2,3,4,5,6,7,8,9}
var wg sync.WaitGroup

for i := 0; i < len(toProcess); i++ {
	wg.Add(1)
	go func(j int) {
		toProcess[j] = someSlowCalculation(toProcess[j])
		wg.Done()
	}(i)
}

wg.Wait()
fmt.Println(toProcess)
{{</highlight>}}

The above will keep the order of the elements in the slice but lets assume this isn't a requirement in our case.

The problem with the above firstly you need to use an old school for loop. Use a range and the above will not do what you expect, with the output being the same as the input. Another issue is adding a waitgroup and having to remember to increment and call done on it. This is additional overhead on the developer. Get it wrong and this program will not produce the right output, either nondeterministically or never finish. In addition if your list is very long you are going to spawn a goroutine for every single one. As I said before this is not an issue itself because go can do that without issue. What is going to be a problem is that each one of those goroutines is going to fight for a slice of the CPU. As such this is not going to be the most efficient way to perform this task. 

What you probably really wanted to do was spawn a goroutine for each CPU and have them pick over the list processing it in turn. To do this in a Go centric way you need to build a channel then loop over the elements of your slice and have your functions read from that channel, then another channel which you read from. Lets have a look.

{{<highlight go>}}
toProcess := []int{1,2,3,4,5,6,7,8,9}
var wg sync.WaitGroup
var input = make(chan int, 5)

wg.Add(1)
go func(input []int, output chan int) {
	for i, _ := range toProcess {
		output <- i
	}
	close(output)
	wg.Done()
}(toProcess, input)


for i := 0; i < runtime.NumCPU(); i++ {
	wg.Add(1)
	go func(input chan int, output []int) {
		for j := range input {
			toProcess[j] = someCalculation(j)
		}
		wg.Done()
	}(input, toProcess)
}

wg.Wait()
fmt.Println(toProcess)
{{</highlight>}}



### #3 Garbage Collector

The Go garbage collector is a very solid piece of engineering. With every release the applications I work on tend to get 3% faster usually due to improvements in it. However prioritizes latency above all else. For API's and UI's this is a perfectly acceptable choice. It's also fine for anything with network calls which are going to be the bottleneck as well. The catch is that Go isn't any good for UI work (that I am aware of) and this choice really hurts you when you want as much throughput as possible. I ran into this as a major issue when working on [scc](https://github.com/boyter/scc/) which is a command line application which wants as much throughput as possible.

