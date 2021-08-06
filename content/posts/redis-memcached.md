---
title: Memcached vs Redis Deep Dive
date: 2050-11-12
---

Most of us have used either redis or memcached at some point in our career. However I have seen a lot of misinformation about which one you should be using, including some incredibly heated arguments over it without any in depth detail. Saying you should use redis because IndieJoe239 said its newer and better on StackOverflow is not a good reason to pick one thing over another.

But lets get the obvious stuff out of the way first.

Redis is not just a key value store, although thats how most use it.

It supports other data types, such as strings, lists, sets, hashes, sorted sets, bitmaps and hyperloglogs.




Lets do a brief trip through time.

Memcached released in 2003.
Written in Perl then rewritten in C.
Originally for livejournal, now used by youtube, reddit, facebook, pinterest, twitter, wikipedia

Redis released in 2009.
Prototyped in TCL and then translated to C.
Originally to speed up Salvatore's startup used by github, instagram, stackoverflow 

So things to keep in mind. Most CPU's in those days had 1-2 cores. I suspect this influenced the design of them a lot.



https://www.adayinthelifeof.nl/2011/02/06/memcache-internals/
https://xuri.me/2017/10/07/memcache-internals.html
https://nosql.mypopescu.com/post/13506116892/memcached-internals-memory-allocation-eviction
https://www.igvita.com/2008/04/22/mysql-conf-memcached-internals/
https://memcached.org/blog/modern-lru/

https://redis.io/topics/lru-cache
https://www.reddit.com/r/redis/comments/3tcfuz/why_lots_of_memory_management_problems_just/
https://redis.io/topics/ARM




https://redis.io/topics/lru-cache
https://memcached.org/blog/modern-lru/
    https://info.varnish-software.com/blog/introducing-varnish-massive-storage-engine
https://web.archive.org/web/20210328200630/https://www.adayinthelifeof.nl/2011/02/06/memcache-internals/
https://holmeshe.me/understanding-memcached-source-code-X-consistent-hashing/
https://www.infoworld.com/article/3063161/why-redis-beats-memcached-for-caching.html
https://www.imaginarycloud.com/blog/redis-vs-memcached/
https://software.intel.com/content/www/us/en/develop/articles/enhancing-the-scalability-of-memcached.html

https://stackoverflow.com/questions/17759560/what-is-the-difference-between-lru-and-lfu
https://github.com/memcached/memcached/wiki/ConfiguringServer#threading
https://redis.io/topics/cluster-spec


https://redis.io/topics/cluster-spec
https://alibaba-cloud.medium.com/redis-vs-memcached-in-memory-data-storage-systems-3395279b0941
https://www.imaginarycloud.com/blog/redis-vs-memcached/
https://aws.amazon.com/elasticache/redis-vs-memcached/
https://www.baeldung.com/memcached-vs-redis
https://stackoverflow.com/questions/10558465/memcached-vs-redis