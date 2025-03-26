---
title: Estimating Sphinx Search RAM Requirements
author: Ben E. Boyter
type: post
date: 2014-06-19T10:57:03+00:00
url: /2014/06/estimating-sphinx-search-ram-requirements/
categories:
  - Search Engine
  - Sphinx

---
If you run Sphinx Search you may want to estimate the amount of RAM that it requires in order to per-cache. This can be done by looking at the size of the spa and spi files on disk. For any Linux system you can run the following command in the directory where your sphinx index(s) are located.```
ls -la /SPHINXINDEX/|egrep "spa|spi"|awk '{ SUM += $5 } END { print SUM/1024/1024/1024 }'

```

This will print out the number of gigabytes required to store the sphinx index in RAM and is useful for guessing when you need to either upgrade the machine or scale out. It tends to be accurate to within 200 megabytes or so in my experience.
