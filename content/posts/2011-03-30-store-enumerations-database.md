---
title: How I store Enumerations in the Database
author: Ben E. Boyter
type: post
date: 2011-03-30T23:16:26+00:00
url: /2011/03/store-enumerations-database/
categories:
  - Design

---
One of the things I come across in databases now and then is a collection of single tables with a name like &#8220;MessageType&#8221;. You have a look in them and it turns out to have 6 or so rows with no foreign key relationships. Every single time it turns out to be someone had the idea to store an Enumeration (Enum) type in the database. Not a bad idea as it turns out since you can add sort options, soft deletes and the like, but the implementation of a single table for each one is flawed.

The following is how I deal with it (probably not ideal but works well for me). Essentially you define two tables in the database with names like Lookup and Value. Inside lookup you have something similar to the following.

<pre>+------+
|id    |
|lookup|
|name  |
+------+</pre>

<span style="line-height: 1.714285714; font-size: 1rem;">This is basicly a representation of the enum name. Id is usually an autoincrementing id to make joins easy while lookup is the primary key. This is the definition of the enum, IE the name part in the database, or in our example &#8220;Message&#8221;.</span>

Then you add the enum values to your Values table which looks similar to the below,

<pre>+---------+
|id       |
|lookupid |
|name     |
|sortorder|
|deleted  |
+---------+</pre>

<span style="line-height: 1.714285714; font-size: 1rem;">Then through the power of a simple join you can get your enum values,</span>

<pre>SELECT * FROM Value v INNER JOIN Lookup l ON l.id = v.lookupid WHERE l.name = '?';</pre>

<span style="line-height: 1.714285714; font-size: 1rem;">Adding a simple index on lookupid and id ensures that any lookups are pretty fast (its a very simple join), and you are away. A single place to look for your enum values, the ability to add all sorts of extra metadata to your enums and no more creation of dozens of small tables in your database.</span>