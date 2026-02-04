---
title: 'C# Vector Space Implementation'
author: Ben E. Boyter
type: post
date: 2013-08-13T05:59:09+00:00
url: /2013/08/c-vector-space-implementation/
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
  - Free Software

---
Since I am writing lots of Vector Space implementations in Go, Python etc&#8230; I thought I would add another one in C#. This one is a little more verbose then either the Python or Go implementations. The verbosity is mostly due to not using any of the nice C# LINQ functionality which would really reduce the size.

In any case here it is in case you are looking for a simple implementation of this useful class.

{{<highlight csharp>}}
class Program
{
	static void Main(string[] args)
	{
		var v = new VectorCompare();

		var con1 = v.Concordance("this is a test");
		var con2 = v.Concordance("this is another test");

		var t = v.Relation(con1, con2);

		Console.WriteLine(t);
		Console.ReadLine();
	}
}

public class VectorCompare
{
	public double Magnitude(Dictionary&lt;string, int&gt; con)
	{
		Double total = 0;
		foreach (var t in con)
		{
			total += Math.Pow(Convert.ToDouble(t.Value), 2);
		}

		return Math.Sqrt(total);
	}

	public double Relation(Dictionary&lt;string, int&gt; con1, Dictionary&lt;string, int&gt; con2)
	{
		var relevance = 0;
		var topvalue = 0;

		foreach(var t in con1)
		{
			if(con2.ContainsKey(t.Key))
			{
				topvalue += t.Value * con2[t.Key];
			}
		}

		var mag = Magnitude(con1) * Magnitude(con2);

		if(mag != 0)
		{
			return topvalue / mag;
		}
		return 0;
	}

	public Dictionary&lt;string, int&gt; Concordance(string document)
	{
		var con = new Dictionary&lt;string, int&gt;();

		foreach (var word in document.ToLower().Trim().Split(' '))
		{
			if (!string.IsNullOrWhiteSpace(word))
			{
				if (con.ContainsKey(word))
				{
					con[word] = con[word] + 1;
				}
				else
				{
					con[word] = 1;
				}
			}
		}

		return con;
	}
}
{{</highlight>}}