---
title: How to start with Elastic Search in 2018
date: 2028-05-27
---

The architect has decreed that for your next application you will use Elastic Search to provide a rich search experience. Your friendly DevOp's person has spun up some instances with elastic, deployed a cluster or through some other means provided you an elastic search http endpoint. Now what? The team is looking to you to provide some guidance, to get them started and set the direction.

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

At this point you should investigate running elastic locally so you can avoid impacting anyone else, requiring network connectivity and to speed up local development. You have two options. The easiest is run a docker image. However due to licencing issues elastic (the company) has made this a little harder. A while ago elastic released the source code to XPack which is a collection of their propiatary tools. You can read the release here https://www.elastic.co/blog/doubling-down-on-open however one catch is that it means you can accidently run the XPack tools and potentially run into licencing issues. You can read the HN discussion here https://news.ycombinator.com/item?id=16487440

To avoid this and potentially avoid some angry emails I have set the below to use the OSS versions of elastic.

```
docker pull docker.elastic.co/elasticsearch/elasticsearch-oss:6.2.4
docker run -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" -d docker.elastic.co/elasticsearch/elasticsearch-oss:6.2.4
```

The above will pull the OSS version of elastic and run it on port 9200 on your local machine. Once started you can brwose to http://localhost:9200/ and hopefully see the JSON like the above which we used to determine the version. If you need a different version you can find the docker images at https://www.docker.elastic.co/

Option two is to download and run elastic on your machine natively. I have tried the various methods they list including package managers and the like. I found the the easiest and most reliable was download the zip file from https://www.elastic.co/downloads/elasticsearch and then run `bin/elasticsearch` or `bin\elasticsearch.bat`. After a time it should start and you can browse to http://localhost:9200/ to verify.

The next thing to understand is how elastic stores documents. Documents that are indexed need to go into an index and have a type. Indexes can contain one or more types. This sounds limiting but you can search over all indexes or all types within an index or just one type within an index.

Consider it logiclly like the below. You can search at any part of the tree which will search accross all children, or pull back a specific document if you know the key.

```
ElasticSearch
├── Index1
│   ├── Type1
│   │   └── Document1
│   ├── Type2
│   │   └── Document1
│   │   └── Document2
│   │   └── Document3
│   ├── Type3
│   │   └── Document1
├── Index2
│   ├── Type4
│   │   └── Document1
```

The confusing thing however is that documents stored in elastic don't actually need to have the same structure. You can index both of the documents,

{{<highlight json>}}
{
	"title": "The Matrix",
	"year": 1999
}
{{</highlight>}}

and

{{<highlight json>}}
{
	"person": {
		"name": "Keanu Reeves",
		"DOB": "1964",
		"Citizenship": "Canadian"
	} 
}
{{</highlight>}}

Into the same index/type and everything will work. However it will be problematic as a consumer as you will need to guess what type the documents coming out of elastic are. It will be especially problematic when it comes to adding facets and other fancy queries on top of your search.

For the purposes of your project, you probably want a single index and then one or multiple types. Have your index named somthing like what your project is called. As for the types for each "thing" you want to search across E.G. `ticket`, `document`, `metadata record` define a type for each one. 


SEARCHING

almost everyone puts some "magic" on top of the queries.

EXPLAIN

```
{
  "explain": true,
  "query": {
    "bool": {
      "must": [
        {
```