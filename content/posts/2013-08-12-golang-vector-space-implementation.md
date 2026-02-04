---
title: GoLang Vector Space Implementation
author: Ben E. Boyter
type: post
date: 2013-08-12T06:51:30+00:00
url: /2013/08/golang-vector-space-implementation/
nkweb_code_in_head:
  - default
nkweb_Use_Custom_js:
  - default
nkweb_Use_Custom_Values:
  - default
nkweb_Use_Custom:
  - 'false'
categories:
  - Free Software

---
UPDATE &#8211; This is now actually available as a real Golang import with tests. Get it at <https://github.com/boyter/golangvectorspace>

I have mentioned this before somewhere but one of the first things I usually attempt to implement in any programming language I want to play with is a vector space. Its my own personal FizzBuzz implementation. It usually covers everything I need to know in a language (imports, functions, string manipulation, math functions, iteration, maps etc&#8230;) so I consider it a good thing to get started with.

You can see my previous implementation in [Python in a previous post][1].

Anyway I have been playing with Go recently. After skimming though the tutorials I thought I would give my standard test the vector space a go. The below is my implementation. It's probably full of bugs and various other issues but seems to work alright for the few tests I tried.

{{<highlight golang>}}
package main

import (
	"fmt"
	"math"
	"strings"
)

func magnitude(con map[string]float64) float64 {
	var total float64 = 0

	for _, v := range con {
		total = total + math.Pow(v, 2)
	}

	return math.Sqrt(total)
}

func concordance(document string) map[string]float64 {
	var con map[string]float64
	con = make(map[string]float64)

	var words = strings.Split(strings.ToLower(document), " ")

	for _, key := range words {

		_, ok := con[key]

		key = strings.Trim(key, " ")

		if ok && key != "" {
			con[key] = con[key] + 1
		} else {
			con[key] = 1
		}

	}

	return con
}

func relation(con1 map[string]float64, con2 map[string]float64) float64 {
	var topvalue float64 = 0

	for name, count := range con1 {
		_, ok := con2[name]

		if ok {
			topvalue = topvalue + (count * con2[name])
		}
	}

	mag := magnitude(con1) * magnitude(con2)

	if mag != 0 {
		return topvalue / mag
	} else {
		return 0
	}
}

func main() {
	var con = concordance("this is a  test of stuff yes stuff")
	var con2 = concordance("This is a     test")

	fmt.Println(relation(con, con2))
}
{{</highlight>}}

 [1]: http://www.boyter.org/2010/08/build-vector-space-search-engine-python/