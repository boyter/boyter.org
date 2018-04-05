---
title: jQuery Powered Instant Search
author: Ben E. Boyter
type: post
date: 1970-01-01T00:00:00+00:00
draft: true
url: /?p=440

---
When I first saw Google Instant my first thought was &#8220;woah cool&#8221;. I then complained about the killing off of long tail keywords. Later I was thinking about how I could implement it myself. I am no jQuery ninja (or pirate or robot) but to quote Top Gear &#8220;How hard could it be?&#8221;

The resulting code looks similar to the below,

<pre>$(document).ready(function() {
  var runningRequest1 = false; // is the request running
  var request1; // the request itselfHow I managed to get smooth Google Instant Style Searches

$(document).ready(function () {
  var runningRequest = false;
  var request;

  $("#search_input").keyup($.debounce(200, doit));

  function doit(e) {
    if (runningRequest) {
      request.abort();
    }

    var search_input = $(this).val();

    if (search_input.length == 0) {
            $('#results').html('');
            return;
    }
    if (e.keyCode == 13 || search_input.length &gt;= 1 && (e.keyCode != 37 && e.keyCode != 38 && e.keyCode != 39 && e.keyCode != 40)) {
      $('#results').fadeTo('fast', 0.2);
      runningRequest = true;
      var keyword = encodeURIComponent(search_input);
      var url = './ajaxsearch/?s=' + keyword;
      request = $.get(url, function (data, status) {
        runningRequest1 = false;
        if (status == "success") {
          $('#article').html(data).stop().fadeTo('fast', 1);
        }
      });
    }
  }
});

  // if the search input has a keypress up thats not the arrow keys
  $("#search_input").keyup(function(e)  {
    var search_input = $(this).val(); // get the search input
    if(search_input.length &gt;= 1
      && (e.keyCode != 37 && e.keyCode != 38
      && e.keyCode != 39 && e.keyCode != 40)) {

    e.preventDefault(); // stop the default action

    if(runningRequest1){ // if the previous request is running abort it
      request1.abort();
    }

    if(search_input.length == 0) { // if the search input is nothing do nothing
      $('#article').html('');
      return;
    }

      $('#article').fadeTo('fast',0.2); // fade out like google
      runningRequest1 = true; // we are now running the request
      var keyword= encodeURIComponent(search_input);
      var url1='./?s='+keyword;

      request1 = $.get(url1,function(data,status) {
        runningRequest1 = false; // no longer running
	if(status == "success") {
          // if sucessful stick the data in the id and fade in quickly
	  $('#article').html(data).fadeTo('fast',1);
	}
      });
    } // end if keyup
  });
});</pre>

Most of the complexity comes from remembering the previous request. The reason for this is that each key up event thats fired triggers a new ajax postback. The catch is that we are only interested in the most recent one because anything older is not useful to the user. So we ignore that request. This way only the most recent results will appear. The actual issue comes down to network and processing time on the server. If a new postback is faster then the old one you can end up with the old data populating the results and the search looks wrong.

How I managed to get smooth Google Instant Style Searches

$(document).ready(function () {
  
var runningRequest = false;
  
var request;

$(&#8220;#search_input&#8221;).keyup($.debounce(200, doit));

function doit(e) {
  
if (runningRequest) {
  
request.abort();
  
}

var search_input = $(this).val();

if (search_input.length == 0) {
  
$(&#8216;#results&#8217;).html(&#8221;);
  
return;
  
}
  
if (e.keyCode == 13 || search_input.length >= 1 && (e.keyCode != 37 && e.keyCode != 38 && e.keyCode != 39 && e.keyCode != 40)) {
  
$(&#8216;#results&#8217;).fadeTo(&#8216;fast&#8217;, 0.2);
  
runningRequest = true;
  
var keyword = encodeURIComponent(search_input);
  
var url = &#8216;./ajaxsearch/?s=&#8217; + keyword;
  
request = $.get(url, function (data, status) {
  
runningRequest1 = false;
  
if (status == &#8220;success&#8221;) {
  
$(&#8216;#article&#8217;).html(data).stop().fadeTo(&#8216;fast&#8217;, 1);
  
}
  
});
  
}
  
}
  
});