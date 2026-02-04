---
title: How to add multiple tags to a Go struct
date: 2018-05-24
---

I was looking to add multiple tags (the declaration after the struct field) to a struct in Go such that I could have it defined in GORM and in JSON. 

This was much harder to find via any search engine I tried than I would have guessed. The answer thankfully is simple once you know and was provided to me by Josh of https://boyter.org/2017/03/golang-solution-faster-equivalent-java-solution/ fame.

The trick is to define multiple tags but with a space separating them. Easy enough and hopefully this post is found by others with the same issue.

{{<highlight go>}}
Items []Item `gorm:"foreignkey:CollectionId" json:"items"`
{{</highlight>}}