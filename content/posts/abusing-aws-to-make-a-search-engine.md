---
title: Abusing AWS Lambda to make an Aussie Search Engine
date: 2051-03-02
---

I am in the middle of building a new index for searchcode.com from scratch. No real reason beyond I find it interesting. I mentioned this to a work colleague and he asked why I didn't use AWS as generally for work everything lands there. I mentioned something to the effect that you needed a lot of persistent storage, or RAM to keep the index around... Then something about its a pity aws lambda does not...

At that point I trailed off. Something occurred to me. There is a saying in computing.

> Never do at runtime what you can do at compile time.

Lets see how far we can take that, using AWS Lambda to build a search engine, by baking index into the lambda binaries themselves.

The plan, is to shard the index using lambda's. Each one holds a portion of the index compiled into the binary that we deploy. Then we call each lambda using a controller which invokes all of them, collects all the results, sorts by rank, gets the top results and returns them.

That should be enough for a proof of concept.

> AWS Lambda	1,000,000 free requests per month for AWS Lambda	
> AWS Lambda	400,000 seconds of compute time per month for AWS Lambda

Best of all it will probably slide under the AWS Lambda Free tier. If not, perhaps they will reach out and offer me some credits for being such a good sport.

As I was already working on a replacement index I have the majority of the code needed for this just lying around. Also considering all of the media search laws going on in Australia we can make this an Australian search engine, but indexing a chunk of Australian websites and hopefully get a nice free traffic boost.

Also I can copy a lot of this post https://artem.krylysov.com/blog/2020/07/28/lets-build-a-full-text-search-engine/ which is a pretty decent 

Also while this is not totally original the scale out appears to be https://www.morling.dev/blog/how-i-built-a-serverless-search-for-my-blog/


## Getting Source Data

We used to use DMOZ dumps for this. While I did attempt to create a reboot called freemoz a while ago, I never finished it. Thankfully top lists exist.

Get you some data https://hackertarget.com/top-million-site-list-download/

I picked a few, and pulled out all of the Australian websites, IE those ending in .com.au + the most populate websites in Australia, so facebook and twitter for the inital crawl.

## Crawling Some Data

We only have a few million sites. So literally any process for doing this is going to be fast enough.

https://flaviocopes.com/golang-web-crawler/

## Dealing With Data

The standard process for most indexing is as follows,

> Extract -> Tokenize -> Filter

The result is a series of tokens.

### Extract

Getting HTML into something useful, spawned one of the greatest StackOverflow answers ever written https://stackoverflow.com/questions/1732348/regex-match-open-tags-except-xhtml-self-contained-tags/1732454#1732454

Now while parsing is wrong, you can use regular expressions to get some things... but to avoid having people online yell at me I am going to use the following https://github.com/advancedlogic/GoOse which makes it fairly easy.

### Tokenizer

### Stemming

Stemming is a royal pain in the arse to implement. So lets use an existing solution https://github.com/kljensen/snowball and since we are doing Australian sites we can focus on just English, seeing as thats the main language. Id love to throw in some native languages too, but I also want to finish quickly so consider that stretch goal.

### Filter

There is no best use stop word list. So I did a quick search and found this https://www.textfixer.com/tutorials/common-english-words.txt which has the below.

```
a,able,about,across,after,all,almost,also,am,among,an,and,any,are,as,at,be,because,been,but,by,can,cannot,could,dear,did,do,does,either,else,ever,every,for,from,get,got,had,has,have,he,her,hers,him,his,how,however,i,if,in,into,is,it,its,just,least,let,like,likely,may,me,might,most,must,my,neither,no,nor,not,of,off,often,on,only,or,other,our,own,rather,said,say,says,she,should,since,so,some,than,that,the,their,them,then,there,these,they,this,tis,to,too,twas,us,wants,was,we,were,what,when,where,which,while,who,whom,why,will,with,would,yet,you,your
```

Another source might be http://xpo6.com/list-of-english-stop-words/ but the above is fine for my purposes.




## Deployment

I have been a bit remiss in my DevOp's skills recently. Seriously the last time I touched cloudformation I was using JSON though a custom template processor (don't laugh we all do it once).

So why not do it properly this time, and make it easy for those following along at home to try it out.

https://www.sqlshack.com/calling-an-aws-lambda-function-from-another-lambda-function/

https://docs.aws.amazon.com/sdk-for-go/v1/developer-guide/lambda-go-example-run-function.html

