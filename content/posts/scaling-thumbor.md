---
title: Scaling Thumbor to 400 RPS on minimal hardware
date: 2028-04-16
---



Image resizer scaling is one of the more interesting problems I have worked on in the last 10 years of so. I was part of a small team that designed and built the resizer that powers the nine.com.au network of sites. Modest by USA standards it gets close to hundreds of millions of views a day across the whole network.

We ended up using shared nothing architecture. The whole thing ran on 6 T2 large AWS instances using a slightly modified version of Thumbor where if you rotated the key the disk cache would be shared so avoid a large scale cache invalidation. It worked quite well and we rotated the key every few weeks.

Things I learnt.

Pretty much all image resizers have the same performance as all the good ones call out to C libraries in the end. Akamai (the CDN we used) despite having site-shield on would still hit the back-end ~100 times for the same image on occasion as I suspect all of the whitelisted machines could request the same image if their internal sharing didn't kick in fast enough.

Long tail images were the ones that brought the resizer to its knees. The hot images would quickly enter the local disk cache and were not an issue. Purge the whole cache though and the long tail images would quickly overwhelm the instances.

The last thing I learnt was to have a backup cloud-front ready to flip over to. At one point Akamai had issues and the resizer was facing origin load. It capped out at about 300 RPS which couldn't keep up with what was expected. It got even worse when the T2 instances ran out of credit. Spinning up cloud-front solved that issue once the DNS flip kicked in.

One good thing to come out of it was I helped write the C# thumbor library as we had one site that was using C# and nobody could move over to the new resizer without it. 