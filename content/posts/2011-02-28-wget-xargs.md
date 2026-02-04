---
title: Using wget and xargs
author: Ben E. Boyter
type: post
date: 2011-02-28T05:46:55+00:00
url: /2011/02/wget-xargs/

---
The joy of the linux/unix command line is how versatile the commands are. I recently had 50,000 URL's I needed to download in a text file. I was thinking about writing a crawler in Python to do it but ended up just doing the following,

```
cat urllist | xargs -P16 wget -i
```

A 16 thread (process really) webcrawler in a single command. Joy.
