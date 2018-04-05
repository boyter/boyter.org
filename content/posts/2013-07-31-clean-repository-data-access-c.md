---
title: 'Clean Repository Data Access in C#'
author: Ben E. Boyter
type: post
date: 2013-07-31T23:52:14+00:00
url: /2013/07/clean-repository-data-access-c/
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
  - Design
  - Tip
  - Unit Testing

---
Mostly as a self reference here is an extremely clean data access pattern possible using C# and Entity Framework. It saves you the effort of mocking the database context as the code you end up writing is so simple it is all compile time checked.

Essentially you define a very simple class which provides a single method for getting data (although you may want a save data method too) and make sure you add an interface to make unit testing/mocking easier.

<pre>public interface IUrlRepository
{
	IQueryable GetUrl();
	void Save(Url url);
}

public class UrlRepository : IUrlRepository
{
	public DbContext _context = null;

	public UrlRepository()
	{
		_context = new DbContext();
	}

	public IQueryable GetUrl()
	{
		return from u in _context.Urls
			   select u;
	}

	public void Save(Url url)
	{
		_context.Urls.AddObject(url);
		_context.SaveChanges();
	}
}</pre>

As you can see rather then returning a list you return an IQueryable. Because entity framework is lazy you can then add extension methods over the return like so.

<pre>public static class UrlRepositoryExtention
{
	public static IQueryable ByCreatedBy(this IQueryable url, string User)
	{
		return url.Where(p =&gt; p.Created_By.Equals(User));
	}

	public static IQueryable OrderByCreateDate(this IQueryable url)
	{
		return url.OrderByDescending(x =&gt; x.Create_Date);
	}
}</pre>

With this you end up with a very nice method of running queries over your data.

<pre>var url = _urlRepo.GetUrl().OrderByCreateDate();</pre>

Since it can all be chained you can just add more filters easily as well.

<pre>var url = _urlRepo.GetUrl().OrderByCreateDate().ByCreatedBy("Ben Boyter");</pre>

What about joins I hear you ask? Well thankfully you this pattern takes care of this too. Just have two repositories, pull the full data set for each and do the following.

<pre>var users = _userRepo.GetUser();
var locations = _locationRepo.GetLocation();

var result =  from user in users
              join location in locations on user.locationid equals location.id && location.name = "Parramatta"
              select user;</pre>

The best thing is that its all lazy evaluation so you don&#8217;t end up pulling back the full data set into memory. Of course at a large enough scale you will probably hit some sort of leaky abstraction issue and end up rewriting to use pure SQL at some point, but for getting started this method of data access is incredibly powerful with few chances of errors.

Finally you get the advantage that you can provide pure unit tests over your joins. Because you can mock the response from your repository easily you don&#8217;t have to create a seed database and provide a connection. This is fantastic for TDD especially when running offline or on your local machine.