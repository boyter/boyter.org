---
title: Media Clipping using ffmpeg and Cache Eviction 2 Random for Disk Caching at Scale
date: 2019-04-04
---

A short time ago one of the more interesting blog posts (to me anyway) about [cache eviction](http://danluu.com/2choices-eviction/) popped up on [Hacker News](https://news.ycombinator.com/item?id=19188642) which prompted me to post the following comment.

> Love reading this. It has always been one of those interesting things I kept in the back of my mind in my day to day.

> I was very excited when I actually got to implement it on a real world project.

> I was writing a scale out job which used ffmpeg to make clips of video files. To speed it up I kept the downloaded files (which could be 150 GB in size) as a local cache. Quite often a clip is made of the same file. When the disk was full (there was a separate disk for download and clip output) selected two of the downloaded files randomly and deleted the older one. Loop till there was enough disk space, or no files.

> It's something I thought I would never actually get to implement in the real word, and thus far is working very well, the caching speeds things up and the eviction seems to avoid too many cache misses. 

Since I have a policy of trying to keep any content I write on-line mirrored on this blog I thought I would take the above and flesh it out a little.

As mentioned I remember reading this some time ago. It literally was something I considered very cool, but since day to day I don't work on redis which uses a [modified version of the algorithm](https://redis.io/topics/lru-cache#approximated-lru-algorithm) or some other caching solution I figured it was something I would never get to implement in a real world project.

In short the application is a large archive of video/audio/image content which holds about 900 TB of data over the last century. Quite often the video files in the application are in production grade formats such as MOV and MXF and with 2 hour programs/films inside the archive they can be over 300 GB in size. Due to the woeful state of the internet in Australia and the requirement that this archive work nationally bandwidth use is a real problem. Users in regional areas simply are unwilling or unable to download a 300 GB file especially when quite often they want a 5 minute snippet taken from the middle of it.

The application is deployed inside AWS and while its video processing suite using Elemental is very good, for taking a snippet/clip out of a file it is not ideal currently. The reason being it will actually transcode the file during this process. I have let AWS know that this is why Elemental is not being used in this case.

The reason this was undesirable is that the users can be quite picky about the formats and as such it was easier to preserve the original format then try to beat everyone over the head on an agreed format.

As such the solution proposed was to use ffmpeg. It could pass through the file preserving the container and all the other embedded metadata such as data streams. The actual solution implements two ffmpeg commands, the first trying to preserve all information and the second as a fallback in case of failure with the addition of stripping out data streams. The idea being that at least it worked, even if you lost some information and you can always download the full file as a albeit not ideal failsafe.

