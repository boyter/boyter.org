---
title: How to start with Elastic Search in 2019
date: 2018-12-10
---

The architect has decreed that for your next application you will use Elastic Search to provide a rich search experience. Your friendly DevOp's person has spun up some instances with elastic, deployed a cluster or through some other means provided you an elastic search HTTP endpoint. Now what? The team is looking to you to provide some guidance, to get them started and set the direction.

The below is aimed at developers who need to write a search interface which is backed by Elastic search. It will not cover the setup or use or install of anything like Kibana. Pure custom interfaces is what we are talking about.

The below should be enough for anyone to get started with elastic and then produce a modern search interface.

## Basics / Getting Started

The main thing to keep in mind with elastic (or any search service) is that there are two main portions. Indexing and searching. Indexing is the process of taking a document you have defined and adding it to the search service in such a way that you can support your search requirements. Searching is the process of taking the users wants and turning it into a query that uses the index to return something useful.

As with most things you need to know what the user is trying to achieve before you can work on either.

The first thing to do is determine what version of elastic you are working with. Either ask your friendly DevOps person or alternatively load the elastic HTTP endpoint (running locally it would be http://localhost:9200/ )in your browser of choice,

{{<highlight json>}}
{
  "name" : "3v6q69Q",
  "cluster_name" : "docker-cluster",
  "cluster_uuid" : "3iTmTSfTRbWs_Cs48_7EDQ",
  "version" : {
    "number" : "6.5.0",
    "build_flavor" : "oss",
    "build_type" : "tar",
    "build_hash" : "816e6f6",
    "build_date" : "2018-11-09T18:58:36.352602Z",
    "build_snapshot" : false,
    "lucene_version" : "7.5.0",
    "minimum_wire_compatibility_version" : "5.6.0",
    "minimum_index_compatibility_version" : "5.0.0"
  },
  "tagline" : "You Know, for Search"
}
{{</highlight>}}

You should see something like the above. In this case the version number is 6.5.0. This is important to know as there have been breaking changes between the major versions and a lot of the books and documentation you are likely to encounter on-line will not be correct. This guide is written with version 6.5.0 in mind, but was tested with versions back in the 6.2.0 range.

At this point you should investigate running elastic locally so you can avoid impacting anyone else, requiring network connectivity and to speed up local development. You have two options. The easiest is run a docker image. However due to licensing issues elastic (the company) has made this a little harder. A while ago elastic released the source code to XPack which is a collection of their propitiatory tools. You can read the release here https://www.elastic.co/blog/doubling-down-on-open however one catch is that it means you can accidentally run the XPack tools and potentially run into licensing issues. You can read the HN discussion here https://news.ycombinator.com/item?id=16487440

To avoid this and potentially avoid some angry emails I have set the below to use the OSS versions of elastic.

```
docker pull docker.elastic.co/elasticsearch/elasticsearch-oss:6.5.0
docker run -p 9200:9200 -p 9300:9300 -e "discovery.type=single-node" -d docker.elastic.co/elasticsearch/elasticsearch-oss:6.5.0
```

The above will pull the OSS version of elastic and run it on port 9200 on your local machine which is the default Elastic Search port. Once started you can browse to http://localhost:9200/ and hopefully see the JSON like the above which we used to determine the version. If you need a different version you can find the docker images at https://www.docker.elastic.co/

Option two is to download and run elastic on your machine natively. I have tried the various methods they list including package managers and the like. I found the the easiest and most reliable was download the zip file from https://www.elastic.co/downloads/elasticsearch and then run `bin/elasticsearch` or `bin\elasticsearch.bat`. After a time it should start and you can browse to http://localhost:9200/ to verify.

## Communication

The easiest way to communicate with elastic search is though restful HTTP requests. I personally found it easiest to do this when testing and trying ideas using Postman https://www.getpostman.com/ Once I had things working I converted them into code which made appropiate restful GET/POST/PUT/DELETE requests. CURL would work just as well for this, however I found that Postman's ability to control headers with dropdowns and saving of requests useful.

There are many different API wrappers for Elastic written for different languages, however I humbly suggest that you avoid them. The reasons being,

 * They are an abstraction on an abstraction which is the Elastic API
 * It removes you from knowing what is actually happening
 * You cannot easily convert between languages
 * Generally you cannot easily replay the HTTP requests using Postman or CURL

I did try a few wrappers, but quickly discarded them in favor of direct HTTP calls based on the above reasons. Keep in mind this is just my opinion, but I found every wrapper more annoying then anything else and favor the ability to verify in postman before implementing the same thing in code.

I have included an export of the postman queries TODO ADD POSTMAN LINK HERE to assist with getting started quickly.

## How Elastic Stores Documents

The next thing to understand is how elastic stores documents. Documents that are indexed need to go into an index and have a type. Indexes can contain one or more types. This may sound limiting but you can search over all indexes or all types within an index or just one type within an index if you require.

Consider it logically like the below. You can search at any part of the tree which will search across all children, or pull back a specific document if you know the key.

```
ElasticSearch
├── Index1
│   ├── Type1
│   │   └── Document1
│   ├── Type2
│   │   └── Document2
│   │   └── Document3
│   │   └── Document4
│   ├── Type3
│   │   └── Document5
├── Index2
│   ├── Type1
│   │   └── Document6
│   ├── Type4
│   │   └── Document7
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

Into the same index of the same type and everything will work. However it will be problematic as a consumer as you will need to guess what type the documents coming out of elastic are. It will be especially annoying when it comes to adding facets and other fancy queries on top of your search.

> Rule of thumb. Use an index per project and type per each unique thing you want to search against.

For the purposes of your project, you probably want a single index and then one or multiple types. Have your index named something like what your project is called. As for the types for each "thing" you want to search across E.G. `ticket`, `document`, `metadata record` and define a type for each one.

To store a document in elastic under an index and type you POST to the endpoint with the JSON you want to create.

For the above you could POST our Keanu document to the index `film` and the type `actor` to the endpoint `http://localhost:9200/film/actor` with the type as `application/json`. The result of this should be similar to the below,

{{<highlight json>}}
{
    "_index": "film",
    "_type": "actor",
    "_id": "xeB3nGcB5wabZ-h5JSJW",
    "_version": 1,
    "result": "created",
    "_shards": {
        "total": 2,
        "successful": 1,
        "failed": 0
    },
    "_seq_no": 0,
    "_primary_term": 1
}
{{</highlight>}}

The above indicates that the document was added to the index film with the type actor and that Elastic has generated the unique ID for this document as being `xeB3nGcB5wabZ-h5JSJW`.

> Don't use elastic as a primary data store. Use another document store for persistence and populate elastic using it.

It is worth-while writing a robust way of populating elastic from your documents before doing anything else. This allows you to delete and rebuild the index at will allowing for rapid iteration. It also ensures that you have a way to rebuild everything should your elastic cluster die or have issues. For a smallish cluster of 6 nodes with 4 CPU's each you should be able to index over 1 million documents in under an hour.

## Mappings

Mappings define type and values in documents. You use them to specify that fields within your document should be treated as numbers, dates, geo-locations and whatever other types elastic supports. You can also define the stemming algorithm used and other useful index fields.

 > You have to define a mapping if you want to provide functionality such as aggregations or facets. You cannot add a mapping after indexing any document. To add one afterwards requires dropping the index and re-indexing the content.

You define a mapping by putting to the index/type inside elastic before then adding a document. Consider For example our previous document defining Keanu Reeves. With the below definition the `person.DOB` field will be treated as a date in the format `yyyy-MM-dd` and will ignore malformed dates. Malformed dates being dates which have a non matching format or are empty. It will also treat the `type` field of the document as a single keyword allowing us to perform aggregations and facets on this field.

```
PUT: http://localhost:9200/film/
TYPE: application/json
```
{{<highlight json>}}
{
  "mappings": {
    "actor": {
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

To set the mapping you need to PUT the above to `http://localhost:9200/film/` which would create the new type of actor with the mappings as specified. The result of this would look similar to the below,

{{<highlight json>}}
{
  "acknowledged": true,
  "shards_acknowledged": true,
  "index": "film"
}
{{</highlight>}}

## Searching

Almost everyone puts some "magic" on top of the queries, where the magic is trying to modify the users query to produce the intended result. Its worth keeping in mind that any search program at heart is a big dumb string matching algorithm with some ranking on top. The true value from search is knowing the data, knowing that the user is trying to archive and tweaking both the index and the queries to help achieve this goal.

To search across an index you have two options. 

For basic search across everything and return the most relevant documents a basic GET request will work. Given that you should have elastic running locally you can browse to `http://localhost:9200/_search?q=keanu` which will perform a search across all indexes and all types. To restrict to an index you have created `http://localhost:9200/film/_search?q=keanu` and to restrict to a type inside that index `http://localhost:9200/film/actor/_search?q=keanu`

With the above you get all of the usual elastic syntax. Boolean searches `keanu AND reeves`, wildcards `kean*`, proximity `"keanu reeves"~2`, fuzzy search `kean~2` all work as you expect. You can target specific fields to search `person.name:keanu` or combine multiples of the above `person.name:kean~2 AND canadi*`. For cases where all you require is to present the information this might be enough. One thing to keep in mind however is that a search done like this will default to an OR search. This means each additional search term added to the query will increase the number or results which can seem counter intuitive.

The other option is to post to the same endpoints using the elastic search syntax. This is more complex and involved but provides the option to perform facet/aggregations and as such is likely what you will need to do.

If craft the following HTTP requests and POST like the following,

```
POST: http://localhost:9200/film/actor/_search
TYPE: application/json
```
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
              "fact",
              "person.citizenship"
            ]
          }
        }
      ]
    }
  }
}
{{</highlight>}}

The result will be a search for `keanu` over the fields `person.name` `fact` and `person.citizenship`. If keanu appears in any of those fields within a document it will be returned as a match.

Things to note. This query is by default an AND search. This means adding additional terms will reduce the number of results. You can of course change this to OR if that is your requirement.

### Multiple Fields

If you are searching across multiple fields the terms you are searching for need to be in all of them.

This is especially annoying if your plan to search over multiple specific fields is something like the below,

```
POST: http://localhost:9200/film/actor/_search
TYPE: application/json
```
{{<highlight json>}}
{
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
{{</highlight>}}

Believe it or not it will not match anything as Elastic is looking for a single field that has both terms of keanu and canada in it. To get around this you have two options. The first is to educate your users and the second is to modify elastic and how it indexes. 

If you educate your users to put AND in between the terms that will resolve the issue. This is something you can put into your "magic" on top of the search however, it means you need to parse the users queries which can be problematic.

To modify elastic you can create an aggregated field which contains everything you want to search across and then search against that. You need to define the aggregated field when defining mappings. As such in order to make the above search work drop the index, and create the mapping like below. Then add the document back to the index.

The below has a special field which I called `_everything` but could be whatever name you want which contains the concatenation of the fields specified above it.

{{<highlight json>}}
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
{{</highlight>}}

At this point the following search will work.

```
POST: http://localhost:9200/film/actor/_search
TYPE: application/json
```
{{<highlight json>}}
{
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
{{</highlight>}}

The new addition is searching against the `_everything` field. Note that we keep the other fields. This is because if all the terms do match elastic can use them as a signal in its internal ranking algorithm which should help it produce more relevant results. This would not be the case in the above search but for example searching for `canada` would be impacted by this.

## Highlights / Snippets

Highlights are how you show the relevant portion of the search to your user. Usually they just consist of a relevant potion of text extracted from the document with the matching terms highlighted. I am not sure how elastic actually achieves this under the hood, but if you are curious you can read https://boyter.org/2013/04/building-a-search-result-extract-generator-in-php/ which explains how I created one some years ago and compared it to other solutions.

Thankfully elastic can do this for you saving you the effort. Add highlight to your query and it will return highlights for the matching fields.

```
POST: http://localhost:9200/film/actor/_search
TYPE: application/json
```
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

The parameter number of fragments allows you to control the number of highlights that return. Say you have a document with a single field with lots of text and lots of matching snippets setting the value to higher than 1 will return more relevant highlights from the field up-to the value you specify. The fragment size is the amount of surrounding characters. It should never exceed this value but can be less. Fields specifies which fields can produce a highlight, with * as done above meaning any field search across can produce a highlight.

## Facets / Aggregations

One of the things you likely want from your search are facets. These are the aggregation roll-ups you commonly see on the left side of your search results allowing you in the example of Ebay to filter down to new or used products.

Sticking with our example of Keanu you can see that in the below mock-up that we want to be able to filter on the `type` field of our document so we can narrow down to actors, directors, producers or whatever other types we have for people in our index.

![Profile Result](/static/start-with-elastic-search-2018/search_facets.png)

Facets are the result of setting the keyword type in the mapping. Once you have set the mapping then added the document you can then request facets to be produced for that field.

To generate facts for a search you want to run a search with some aggregations set.

```
POST: http://localhost:9200/film/actor/_search
TYPE: application/json
```
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
              "fact",
              "person.citizenship",
              "_everything"
            ]
          }
        }
      ]
    }
  },
  "aggregations": {
    "type": {
      "terms": {
        "field": "type",
        "min_doc_count": 0
      }
    }
  }
}
{{</highlight>}}

When run against an index with the mapping setup you will get back in your response the following,

{{<highlight json>}}
  "aggregations": {
        "type": {
            "doc_count_error_upper_bound": 0,
            "sum_other_doc_count": 0,
            "buckets": [
                {
                    "key": "Actor",
                    "doc_count": 1
                }
            ]
        }
    }
{{</highlight>}}

Which is a sum of each of the unique keys based on the field you specified. You can have multiple aggregation types if you have multiple facets, with each having the key of the name you set in your aggregation request.


TODO how to actually use the result of the above to filter a search down


## Size / Pages

You can page through results by adding size and from to your queries.

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
              "fact",
              "person.citizenship",
              "_everything"
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
  },
  "aggregations": {
    "type": {
      "terms": {
        "field": "type",
        "min_doc_count": 0
      }
    }
  },
  "size": 15,
  "from": 0
}
{{</highlight>}}

Size is the number of results to return and from is from which count you want to start. So to get page 2 where you have 15 results per page you need to set from to be `Page*PerPage` which in this case would be 15.

> By default you can only page through the first 10,000 records but you can change this using the index.max_result_window setting against the settings endpoint

## Deleting

Dropping or deleting an index is actually scarily simple. You need only send a HTTP DELETE to the index you want to remove. 

```
DELETE: http://localhost:9200/film/
```

The above will return the below if the index exists and it was able to be deleted.

{{<highlight json>}}
{
  "acknowledged": true
}
{{</highlight>}}

> I always read the above using the Red Alert Soviet voice in my head which causes me to giggle to the annoyance of my colleagues

To delete a single document from the index you need to know its id which you can find by using a query and looking at the value `_id` which for auto generated id's will be something like `x-Apn2cB5wabZ-h5-SLf`. To remove it you send a DELETE against the index/type with the id like so.

```
DELETE: http://localhost:9200/film/actor/x-Apn2cB5wabZ-h5-SLf
```

Which when run with the correct id will produce a result like the below.

{{<highlight json>}}
{
    "_index": "film",
    "_type": "actor",
    "_id": "x-Apn2cB5wabZ-h5-SLf",
    "_version": 2,
    "result": "deleted",
    "_shards": {
        "total": 2,
        "successful": 1,
        "failed": 0
    },
    "_seq_no": 1,
    "_primary_term": 1
}
{{</highlight>}}

Which indicates that the document was deleted with details about which index and type it was removed from.


## Sorting

By default if you don't specify any sorting then the results are sorted by the score which is the rank of the document. The score is based on whatever terms you searched for. However searches for say `*` have every document returning a score of 1 and as such there is no natural sorting that can apply, and the results will return in what appears to be a random or nondeterministic order.

Given our sample document we can change the sorting to be based on the date field we defined in the mapping. TO search ascending we can use the below.

{{<highlight json>}}
  {
  "sort": [
    {
      "person.DOB": {
        "order": "asc"
      }
    },
    "_score",
    "_doc"
  ],
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
              "person.citizenship",
              "_everything"
            ]
          }
        }
      ]
    }
  }
}
{{</highlight>}}

The above will order by the DOB field descending. Where the DOB is the same it will then rank based on score and then finally the document id. Doing it like this ensures that you have a stable sort order for your results.

If you sort based on a date field and its mapping ignores malformed values then documents which break the format will appear at the bottom of the results irrespective of which way you sort the document. For example, if you have two documents indexed with the first document having a proper date and another document with an empty one then sorting descending or ascending will have the document with the proper date appear as the first result in the list.

> Remember that scoring varies between nodes on the same cluster

Because of the above you may want to try to smooth out the scoring.

It is likely that someone will want to know why on multi-node elastic clusters that the scores between documents change slightly if you spam the same search over and over. The reason for this is that the TF/IDF ranking algorithm produces slightly different results between nodes as they don't contain the same documents. When a search is run the master picks different nodes to run and as such the score changes. This means for some searches that have very common words such as "europe" that repeated searches may have documents move up and down in the ranking.

There is not much you can do about this. Elastic does have the ability to pre-check the ranks by contacting all the shards to get a global TF/IDF score but this slows things down and in my tests didn't impact the result. Suggestions to help with this are as follows.

* Sort the documents by score followed by id. This should help ensure a more consistent order.
* Have elastic cache the results (see below).

Keeping in mind that edits to documents or adding new ones potentially influences the score of every other document and on a live system having 100% identical results is never going to be possible without caching externally and then having stale results. Also for any real search that contains multiple terms this is less likely to become an issue as the natural sorting of the documents will have enough variance so documents will not rank equally.

## Caching

You can have elastic cache search results internally by adding `?request_cache=true` to the end of your search queries. As far as I am aware there is no penalty to this as elastic will expire the cache based on document changes. It is also useful to have this on as it will help smooth out results for the same search term done repeatedly.

## Explaining Ranking / Scoring / Relevance

The below is a fairly simplistic explanation of how ranking works in Elastic. It is unlikely you will need to know this in depth, but it is useful to know if people start asking why some documents outrank others and how to search effectively.

Generally any search service uses a mixture of pre-ranking and query time ranking to produce results. Pre-ranking happens when the document is indexed. Query ranking takes into account the users query and augments the pre-ranking algorithm. Pre-ranking is the most efficient way of ranking results but best of breed engines use a combination of both.

Elastic search uses TF/IDF ranking by default for pre-ranking. You can change this to other implementations of rankers such as BM25 but unless you have specific reasons to do so there is no need. TD/IDF In effect exploits the idea that not all words are considered equally important, and not all documents contain the same words.

TF is term frequency just means how often does the word appear in the document. A document with multiple occurrences of the same word is probably more relevant for that word. IDF is inverse document frequency, which smooths out the TF by determining that while a word may appear 10 times in a document it also occurs in every document and as such is probably not very important.

As such a word is considered important if it does not appear very often across all document. A search for this word would rank a document with multiple occurrences of this word higher then a document with a single occurrence. In addition to the above shorter fields outrank longer ones. So things like titles tend to outrank fields with large bodies of text.

Elastic search also used to apply the Vector Space model to ranking at query time, but I am not sure if this is still the case. If you want some detail about the Vector Space model read the following, https://boyter.org/2011/06/vector-space-search-model-explained/ https://boyter.org/2010/08/build-vector-space-search-engine-python/ https://boyter.org/2013/08/c-vector-space-implementation/ https://boyter.org/2013/08/golang-vector-space-implementation/ This is a query time ranking algorithm run at search time. Due to the way it works it ranks documents of similar length as being a closer match, which in practice with a users usual search terms means it also ranks shorter fields higher over longer ones.

The result of the above is that if you search for the following "commonWord OR rareWord" documents containing the rare word will be ranked higher. Of the documents with the rare word, those which have multiple occurrences of it or those where it exists in shorter fields will outrank others where the rare word appears in longer ones.

## Explain

If someone ever does ask to explain how the ranking works you can add to any search JSON `"explain": true` and get an overview of what is actually happening under the hood by elastic.

You can see how to do so using the below by adding `"explain": true` to your search queries.

{{<highlight json>}}
{
  "explain": true,
  "query": {
{{</highlight>}}

The response of which will include something like the following which is horribly verbose, but very explicit in what is happening under the hood. You can find details of what this actually means on the elastic documentation https://www.elastic.co/guide/en/elasticsearch/reference/current/search-explain.html

{{<highlight json>}}
"_explanation": {
    "value": 0.2876821,
    "description": "max of:",
    "details": [
        {
            "value": 0.2876821,
            "description": "weight(person.name:keanu in 0) [PerFieldSimilarity], result of:",
            "details": [
                {
                    "value": 0.2876821,
                    "description": "score(doc=0,freq=1.0 = termFreq=1.0\n), product of:",
                    "details": [
                        {
                            "value": 0.2876821,
                            "description": "idf, computed as log(1 + (docCount - docFreq + 0.5) / (docFreq + 0.5)) from:",
                            "details": [
                                {
                                    "value": 1,
                                    "description": "docFreq",
                                    "details": []
                                },
                                {
                                    "value": 1,
                                    "description": "docCount",
                                    "details": []
                                }
                            ]
                        },
                        {
                            "value": 1,
                            "description": "tfNorm, computed as (freq * (k1 + 1)) / (freq + k1 * (1 - b + b * fieldLength / avgFieldLength)) from:",
                            "details": [
                                {
                                    "value": 1,
                                    "description": "termFreq=1.0",
                                    "details": []
                                },
                                {
                                    "value": 1.2,
                                    "description": "parameter k1",
                                    "details": []
                                },
                                {
                                    "value": 0.75,
                                    "description": "parameter b",
                                    "details": []
                                },
                                {
                                    "value": 2,
                                    "description": "avgFieldLength",
                                    "details": []
                                },
                                {
                                    "value": 2,
                                    "description": "fieldLength",
                                    "details": []
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    ]
}
{{</highlight>}}

## Search Tips / Tricks

Given the below document here are some searches you can use against it, and why you might want to do them. I do recommend checking https://www.cheatography.com/jelle/cheat-sheets/elasticsearch-query-string-syntax/ for a general purpose elastic search cheat sheet.

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


`fact:canada` 

Will search inside the field fact for the term canada. Use when you want to target a single field inside documents of if you have a field that is not searched by default.

`fact:(canada OR england)`

Will search inside the field fact for the term canada or england, if you omit the OR you will get whatever is the default operator.

`person.name:keanu`

Search under the field person.name for keanu. If the field you are targetting is an array EG `"name": ["one", "two", "three"]` then the search will apply over each of those terms.

`person.*:canadian`

Search any field under person for the term canadian.

`ke?nu`

Search with ? replaced by any single character. You can use this to find common mis-spellings of words that are off by one character. This works well with shorter words where fuzzy search is less effective.

`kea*`

Search where * is replaced by zero or more of any character.

`/[keanu|neo]/`

Search using regular expression. Note not all regular expressions will work. These searches can be very powerful, but generally you can do 99% of what you require without them. Included here just to show that it is possible.

`kean~` 

Fuzzy or sloppy search. Will search for words within 2 characters edit distance of the above by default. Can modify this to specify how fuzzy the search will be.

`keanu~1` 

Fuzzy search within distance of 1 character. An example of using this would be `keanu~1 -keanu` which would find all misspellings of Keanu. The shorter the word the less effective this is and you should look at using ? wildcards instead.