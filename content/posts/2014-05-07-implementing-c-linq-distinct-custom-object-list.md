---
title: 'Implementing C# Linq Distinct on Custom Object List'
author: Ben E. Boyter
type: post
date: 2014-05-07T23:11:49+00:00
url: /2014/05/implementing-c-linq-distinct-custom-object-list/
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
  - Tip

---
Ever wanted to implement a distinct over a custom object list in C# before? You quickly discover that it fails to work. Sadly there is a lack of decent documentation about this and a lot of FUD. Since I lost a bit of time hopefully this blog post can be picked up as the answer.

Thankfully its not as difficult as you would image. Assuming you have a simple custom object which contains an Id, and you want to use that Id to get a distinct list all you need to do is add the following to the object.

{{<highlight java>}}
public override bool Equals(object obj)
{
	return this.Id == ((CustomObject)obj).Id;
}

public override int GetHashCode()
{
	return this.Id.GetHashCode();
}
{{</highlight>}}

You need both due to the way that Linq works. I suspect under the hood its using a hash to work out whats the same hence GetHashCode.