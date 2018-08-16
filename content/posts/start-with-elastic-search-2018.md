---
title: How to start with Elastic Search in 2018
date: 2018-05-27
---

The architect has decreed that for your next application you will use Elastic Search to provide a rich search experience. Your friendly DevOp's person has spun up some instances with elastic, deployed a cluster or through some other means provided you an elastic search http endpoint. Now what? The team is looking to you to provide some guidance, to get them started and set the direction.

## Basics

The main thing to keep in mind with elastic (or any search service) is that there are two main portions. Indexing and searching. Indexing is the process of taking a document you have defined and adding it to the search service in such a way that you can support your search requirements. Searching is the process of taking the users wants and turning it into a query that uses the index to return something useful.

As with most things you need to know what the user is trying to achieve before you can work on either.

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

and (N.B. I will be using this document for the rest of the article)

{{<highlight json>}}
{
  "fact": "Originally intended on becoming an Olympic hockey player for Canada.",
  "type": "Actor",
  "person": {
    "name": "Keanu Reeves",
    "DOB": "1964-09-02",
    "Citizenship": "Canadian"
  }
}
{{</highlight>}}

Into the same index/type and everything will work. However it will be problematic as a consumer as you will need to guess what type the documents coming out of elastic are. It will be especially problematic when it comes to adding facets and other fancy queries on top of your search.

> Rule of thumb. Use an index per project and type per each unique thing you want to search against.

For the purposes of your project, you probably want a single index and then one or multiple types. Have your index named somthing like what your project is called. As for the types for each "thing" you want to search across E.G. `ticket`, `document`, `metadata record` define a type for each one.

## MAPPINGS

Mappings define documents. You can use them to specify that fields within your document should be treated as numbers, dates, geolocations etc... You can also define the stemming algorithm used and other useful index fields.

> You have to define a mapping if you want to provide functionality such as aggregations or facets. You cannot add a mapping after indexing any document.

You define a mapping by putting to the index/type inside elastic before then adding a document. Consider For example our previous document defining Keanu Reeves. With the below definition the `person.DOB` field will be treated as a date in the format `yyyy-MM-dd` and ignore malformed dates, which may have the wrong format or be missing. It will also treat the `type` field of the document as a single keyword allowing us to perform aggregations and facets on this field.

{{<highlight json>}}
{
  "mappings": {
    "meta": {
      "properties": {
        "person.DOB": { 
          "type": "date",
          "format": "yyyy-MM-dd",
          "ignore_malformed": true
        },
        "type": { 
          "type": "keyword"
        }
      }
    }
  }
}
{{</highlight>}}

## FACETS

One of the things you likely want from your search are facets. These are the aggregation rollups you commonly see on the left side of your search results allowing you in the example of Ebay to filter down to new or used products.

Sticking with our example of Keanu you can see that in the below mockup (suppplied by our glorious and talented UX/UI Designer) that we want to be able to filter on the `type` field of our document so we can narrow down to actors, directors, producers or whatever other types we have for people in our index.

![Profile Result](/static/start-with-elastic-search-2018/search_facets.png)

## SEARCHING

Almost everyone puts some "magic" on top of the queries. Its worth keeping in mind that any search at heart is a big dumb string matching algorithm with some ranking on top. The true value from search is knowing the data, knowing that the user is trying to achive and tweaking both the index and the queries to help achieve this goal.

To search across an index you have two options. 

For basic search across everything and return the most relevant documents a basic GET request will work. Given that you should have elastic running locally you can browse to http://localhost:9200/_search?q=keanu which will perform a search across all indexes and all types. To restrict to an index you have created http://localhost:9200/film/_search?q=keanu and to restrict to a type inside that index http://localhost:9200/film/actor/_search?q=keanu

With the above you get all of the usual elastic syntax. Boolean searches `keanu AND reeves`, wildcards `kean*`, proximity `"keanu reeves"~2`, fuzzy search `kean~2` all work as you expect. You can target specific fields to search `person.name:keanu` or combine multiples of the above `person.name:kean~2 AND canadi*`. For cases where all you require is to present the information this might be enough. One thing to keep in mind however is that a search done like this will default to an OR search. This means each addtional search term added to the query will increase the number or results which can seem counter intuitive.

The other option is to post to the same endpoints using the elastic search syntax. This is far more complex and involved but provides the option to perform aggregations and the like.

If you open postman or whatever tool you like to use to craft custom HTTP requests and post like the following,

```
POST: http://localhost:9200/film/actor/_search
TYPE: application/json
BODY: {
  "query": {
    "bool": {
      "must": [
        {
          "query_string": {
            "query": "keanu",
            "default_operator": "AND",
            "fields": [
              "person.name",
              "fact",
              "person.citizenship"
            ]
          }
        }
      ]
    }
  }
}
```

The result will be a search for `keanu` over the fields `person.name` `fact` and `person.citizenship`. If keanu appears in any of those fields within a document it will be returned as a match.


### Multiple Fields

If you are searching across multiple fields terms need to be in all of them.

This is especially annoying if your plan to search over multiple specific fields is something like the below,

```
POST: http://localhost:9200/film/actor/_search
TYPE: application/json
BODY: {
  "query": {
    "bool": {
      "must": [
        {
          "query_string": {
            "query": "keanu canada",
            "default_operator": "AND",
            "fields": [
              "person.name",
              "fact",
              "person.citizenship"
            ]
          }
        }
      ]
    }
  }
}
```

As belive it or not it will not match anything as elastic is looking for a field that has both terms in it. To get around this you can create an aggregated field which contains everything you want to search across and then search against that,

```
{
  "mappings": {
    "meta": {
        "person.name": {
          "type": "text",
          "copy_to": "_everything"
        },
        "fact": {
          "type": "text",
          "copy_to": "_everything"
        },
        "person.citizenship": {
          "type": "text",
          "copy_to": "_everything"
        },
        "_everything": {
          "type": "text"
        }
      }
    }
  }
}
```

then the following search will work.

```
POST: http://localhost:9200/film/actor/_search
TYPE: application/json
BODY: {
  "query": {
    "bool": {
      "must": [
        {
          "query_string": {
            "query": "keanu canada",
            "default_operator": "AND",
            "fields": [
              "person.name",
              "fact",
              "person.citizenship",
              "_everything"
            ]
          }
        }
      ]
    }
  }
}
```

Note that we keep the other fields. This is because if all the terms do match elastic can use them as a signal in its internal ranking algorithm which should help it produce more relevant results.

### Highlights

Highlights are how you show the relevant portion of the search to your user. Usually they just consist of a relevant potion of text extracted from the document with the matching terms highlighted. I am not sure how elastic actualy achives this under the hood, but if you are curious you can read https://boyter.org/2013/04/building-a-search-result-extract-generator-in-php/ which explains how I created one some years ago.

Thankfully elastic can do this for you. Add highlight to your query and it will return highlights for the matching fields.

{{<highlight json>}}
{
  "query": {
    "bool": {
      "must": [
        {
          "query_string": {
            "query": "keanu",
            "default_operator": "AND",
            "fields": [
              "person.name",
              "type",
              "fact",
              "person.citizenship"
            ]
          }
        }
      ]
    }
  },
  "highlight": {
    "number_of_fragments": 1,
    "fragment_size": 150,
    "fields": {
      "*": {}
    }
  }
}
{{</highlight>}}


### Aggregations/Facets
### Size/Pages
### Sorting

If you sort based on a date field that in its mapping ignores malformed then documents which break the format will appear at the bottom of the results irrespective of which way you sort the document. For example, if you have one document with a proper date and another with nothing, sorting descending or ascending will have the document with the data appear in the first result.

Date Ranges


## EXPLAIN

```
{
  "explain": true,
  "query": {
    "bool": {
      "must": [
        {
```