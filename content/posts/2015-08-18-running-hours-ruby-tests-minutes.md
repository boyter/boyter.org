---
title: Running three hours of Ruby tests in under three minutes
author: Ben E. Boyter
type: post
date: 2015-08-18T08:18:47+00:00
url: /2015/08/running-hours-ruby-tests-minutes/
nkweb_code_in_head:
  - default
nkweb_Use_Custom_js:
  - default
nkweb_Use_Custom_Values:
  - default
nkweb_Use_Custom:
  - 'false'
categories:
  - Testing
  - Unit Testing

---
Recently the very cool hard working developers working on Stripe released a post about how they modified their build/test pipeline to reduce their test suite runtime from 3 hours to about 3 minutes.

The article is very [much worth reading][1], as is the discussions that have come around it including those on [Hacker News][2].

A few key takeaways,

* For dynamic languages such as Ruby or Python consider forking to run tests in parallel
  
* Forks are usually faster then threads in these cases and provide good test isolation
  
* For integration tests use docker which allows you to revert the file system easily

The above ensures that the tests are generally more reliable and you avoid having to write your own teardown code which restores state, both in memory for the forks and on disk using Docker.

 [1]: https://stripe.com/blog/distributed-ruby-testing
 [2]: https://news.ycombinator.com/item?id=10055342