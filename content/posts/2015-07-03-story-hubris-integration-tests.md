---
title: A story about Hubris and Integration Tests
author: Ben E. Boyter
type: post
date: 2015-07-03T07:51:07+00:00
url: /2015/07/story-hubris-integration-tests/
nkweb_code_in_head:
  - default
nkweb_Use_Custom_js:
  - default
nkweb_Use_Custom_Values:
  - default
nkweb_Use_Custom:
  - 'false'
categories:
  - 'C#'
  - Testing
  - Unit Testing

---
Philip Dormer Stanhope, 4th Earl of Chesterfield (pictured) managed to embarrass me in front of my peers once. Sort of. In truth it was my hubris that caused the incident. Here is how it happened and what I learnt through the process.

[<img class="alignnone size-full wp-image-1308" src="http://www.boyter.org/wp-content/uploads/2016/08/200px-Philip_Stanhope_4th_Earl_of_Chesterfield.png" alt="Philip Dormer Stanhope, 4th Earl of Chesterfield" width="200" height="239" />][1]

In the summer of 2010 I was tasked with developing a new application where I worked. The requirement was fairly simple &#8220;We need a web application to upload a CSV&#8221;. Requirements such as this aren&#8217;t exactly conducive to a good outcome but I was confident that given the data required to upload it would be fairly easy to do.

The data requirements came in and I got to work. At the time the only option for custom software where I was working was C#, LINQ to SQL, Webforms and SQL Server. Not a huge problem as I like all of those except for Webforms. Thankfully since it was only a simple file upload I didn&#8217;t have much to do there. I had just jumped on the TDD bandwagon and I quickly mocked away the data context (harder to do then you would think in LINQ) and I tested the heck out of the application. Ignoring the Webform component we were looking at 99% test coverage. I even threw in some mutation testing. Dates were checked from the year 1 to the year 9999, integers parsed correctly, string lengths verified. Everything was above board and I proudly stated that our tester would not find any issues in the code.

2.5 minutes. That&#8217;s approximately how long it took for him to find a bug that crashed the application. I was bright red and scrambling to figure out the problem.

Integration is hard. Really hard. Ask anyone where most of their debugging time is and odds are they will say when integration occurs. My tester like any good tester had started with some boundary tests. Integers over 2,147,483,647 (signed), strings over the max length, and dates in the year 1 and 9999.

Wait a minute, didn&#8217;t you just say that was tested? Yep I did. For the exact condition that threw the error too. Turns out that SQL Server only supports dates from 1753, whereas .NET supports 1 and 9999. Why does SQL server only support dates from 1753? That&#8217;s due to to the Calendar (New Style) Act 1750 which our friend Philip Stanhope debated for. Turns out the Sybase developers didn&#8217;t want to add the additional code to calculate dates correctly before 1753 and after so they set that date to be the epoch. This of course caused my code the blow up, and me to get very embarrassed.

The fix BTW to check if its a valid SQL server date is pretty simple,

    
        static bool isValidSqlDate(DateTime date)
        {
            return ((date >= (DateTime)SqlDateTime.MinValue) && (date <= (DateTime)SqlDateTime.MaxValue));
        }
    

So what did I learn from this experience?

Well number one is that unit tests, no matter how thorough can ever be a replacement for integration tests. Even PERFECT unit tests (which I believed mine to be) would not account for something like this. The take away being unit test by all means, but don&#8217;t consider it rock solid till you have actually run it. Integration test that sucker to be sure everything will work at run time.

The second is that it pays to be quietly confident rather then vocally confident. Sure hubris is usually considered a good programmer trait (debatable), which is usually fine, till you end up looking like a fool like I did.

For fun I have included my code comment below I added once I figured this all out. Hail to ye o&#8217; merry man indeed.

    
        /*
         *      Philip Dormer Stanhope, 4th Earl of Chesterfield
         *      
         *      it is because of him we need to validate dates before 1753 in SQL Server
         *      hail to ye o' merry man.
         * 
         *      http://en.wikipedia.org/wiki/Chesterfield%27s_Act
         *
         */

 [1]: http://www.boyter.org/wp-content/uploads/2016/08/200px-Philip_Stanhope_4th_Earl_of_Chesterfield.png