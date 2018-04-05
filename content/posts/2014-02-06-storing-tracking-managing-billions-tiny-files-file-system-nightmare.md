---
title: Why is storing, tracking and managing billions of tiny files directly on a file system a nightmare?
author: Ben E. Boyter
type: post
date: 2014-02-06T01:00:59+00:00
url: /2014/02/storing-tracking-managing-billions-tiny-files-file-system-nightmare/
categories:
  - Tip

---
<span style="color: #000000;"><span style="color: #000000;">Its a real pain when you want to inspect the files, delete or copy them.</span></span>

Try taking 300,000 files and copy them somewhere. Then copy 1 file which has the size of the 300,000 combined. The single file is MUCH faster (its also why we usually do a tar operation before copying stuff if its already compressed). Any database that&#8217;s not a toy will usually lay the 300,000 records out in a single file (depending on settings, sizes and filesystem limits).

The 300,000 files end up sitting all over the drive and disk seeks kill you at run-time. This may not be true for a SSD but I don&#8217;t have any evidence to to suggest this or otherwise.

Even if the physical storage is fine with this I suspect you may run into filesystem issues when you lay out millions if not hundreds of millions of files over a directory and then hit it hard.

<span style="color: #000000;">I have played with 1,000,000 files before when playing with crawling/indexing things and it becomes a real management pain. It may seem cleaner to lay each out as a singe file but in the long run if you hit a large size the benefits aren&#8217;t worth it.</span>