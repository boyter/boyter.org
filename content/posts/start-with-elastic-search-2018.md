---
title: How to start with Elastic Search in 2018
date: 2028-05-27
---

The architect has decreed that for your next application you will use Elastic Search to provide a rich search experience. Your friendly DevOp's person has spun up some instances with elastic, deployed a cluster or through some other means provided you an elastic search http endpoint. Now what?

The first thing to do is determine what version of elastic you are working with. Either ask your friendly DevOps person or alturnativly load the elastic http endpoint in your browser of choice,

{{<highlight json>}}
{
  "name" : "AMXkZa8",
  "cluster_name" : "docker-cluster",
  "cluster_uuid" : "F7Wshi-8TiWjlGeNywDALA",
  "version" : {
    "number" : "6.2.4",
    "build_hash" : "ccec39f",
    "build_date" : "2018-04-12T20:37:28.497551Z",
    "build_snapshot" : false,
    "lucene_version" : "7.2.1",
    "minimum_wire_compatibility_version" : "5.6.0",
    "minimum_index_compatibility_version" : "5.0.0"
  },
  "tagline" : "You Know, for Search"
}
{{</highlight>}}

You should see something like the above. In this case the version number is 6.2.4. This is important to know as there have been breaking changes between the major versions and a lot of the books and documentation you are likely to encounter online will not be correct. This guide will be written with version 6.2.4 in mind.

The next thing to understand is how elastic stores documents. Documents that are indexed need to go into an index and have a type. 