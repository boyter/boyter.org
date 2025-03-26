---
title: Resolve "database is locked" with Go and SQLite 
date: 2024-04-04
---

I have always been a big fan of SQLite and recently was using it with Go/Golang. However due to fact that goroutines are very convenient I quickly ran into the "database is locked" issue where multiple writes would try to update the database at any one time. Multiple reads worked without issue.

I could have solved this by throwing a mutex lock around the database writes, but thats something I could easily mess up by missing the mutex and locking the database at the wrong time. I could also have retries with a backoff which isn't a bad idea for resilience, but overkill for my situation.

A better solution and one that is hard to search for online is to limit the number of open connections.```Go
db.SetMaxOpenConns(1);

```

Setting the above after getting your SQLite database connection will totally resolve the issue. It does in theory lower your read performance, but my brief tests to confirm/deny this didn't indicate any major difference for the sort of load I am expecting.

I was curious about how common this was and checked against [searchcode.com](searchcode.com) [1](https://searchcode.com/?q=lang%3Ago+SetMaxOpenConns+sqlite) and [2](https://searchcode.com/?q=lang%3Ago+db.SetMaxOpenConns%281%29+sqlite). Rather unsurprisingly it seems like a common thing.

Since I had a great deal of issues finding a simple resolution to the problem I thought this post might help someone else.
