---
title: Google's “Colossus”
author: Ben E. Boyter
type: post
date: 2010-09-12T23:07:20+00:00
url: /2010/09/googles-colossus-explained/

---
So Google has called their new indexing system [Caffeine, which is powered by Google's BigTable][1], or as they call it internally Colossus. I guess now all we need is Microsoft to announce their Bing back-end is called ["Guardian" and the world is over][2].

Actually looking at all of the information they have shows that while everyone was chasing MapReduce that Google was looking at implementing a distributed database where each update/trigger implements an update to the index. I am certain that this wouldn't be as efficient as running a MapReduce index build over the whole cluster, but would allow for real time updates.

Interestingly this is what I implemented in my own Search Service (which is still in testing mode) which gives a minute or two delay between something being crawled and added to the index. I suspect that Google noticed that this was the best way of implementing things on one machine and just figured out how to replicate it on thousands.

Interestingly this sounds somewhat similar to how Gigablast works although [Matt Wells Rants Page][3] never goes into specific details.

 [1]: http://www.theregister.co.uk/2010/09/09/google_caffeine_explained/
 [2]: http://www.imdb.com/title/tt0064177/
 [3]: http://www.gigablast.com/rants.html