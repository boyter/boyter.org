---
title: jQuery Hello World Plugin
author: Ben E. Boyter
type: post
date: 2011-04-15T23:17:36+00:00
url: /2011/04/jquery-hello-world-plugin/
categories:
  - Design

---
I was doing a simple job test the other day and one of the questions involved creating a simple jQuery plugin. Having never created one myself I had to look into how to do it. I couldn't find a dead simple hello world plugin example so I thought I would create a simple example here for people to look at.

{{<highlight javascript>}}
(function( $ ){
  $.fn.HelloWorld = function() {
    $(this).html('Hello World!');
  };
})( jQuery );
{{</highlight>}}

The above essentially just attaches a new function called HelloWorld to the basic jQuery object. You can then call it using the below,

{{<highlight javascript>}}
$(document).ready(function () {
  $('body').HelloWorld();
});
{{</highlight>}}

What the above does is calls the HelloWorld function attached to the jQuery object from the body element. This then in turn calls our plugin which then appends "Hello World!" to the body element. The result is you see the test "Hello World!" appear in the body.

You can download the [jQuery hello world plugin][1] and supporting files here to run it yourself if you feel so inclined.

 [1]: http://dl.dropbox.com/u/21583935/searchcode/blog/helloworld.zip