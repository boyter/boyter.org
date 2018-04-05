---
title: 20 lines of code that will beat A/B testing every time
author: Ben E. Boyter
type: page
date: 2015-07-03T04:44:34+00:00
draft: true
private: true
nkweb_code_in_head:
  - default
nkweb_Use_Custom_js:
  - default
nkweb_Use_Custom_Values:
  - default
nkweb_Use_Custom:
  - 'false'

---
http://stevehanov.ca/blog/index.php?id=132

A/B testing is used far too often, for something that performs so badly. It is defective by design: Segment users into two groups. Show the A group the old, tried and true stuff. Show the B group the new whiz-bang design with the bigger buttons and slightly different copy. After a while, take a look at the stats and figure out which group presses the button more often. Sounds good, right? The problem is staring you in the face. It is the same dilemma faced by researchers administering drug studies. During drug trials, you can only give half the patients the life saving treatment. The others get sugar water. If the treatment works, group B lost out. This sacrifice is made to get good data. But it doesn&#8217;t have to be this way.

In recent years, hundreds of the brightest minds of modern civilization have been hard at work not curing cancer. Instead, they have been refining techniques for getting you and me to click on banner ads. It has been working. Both [Google][1] and[Microsoft][2] are focusing on using more information about visitors to predict what to show them. Strangely, anything better than A/B testing is absent from mainstream tools, including Google Analytics, and Google Website optimizer. I hope to change that by raising awareness about better techniques.

With a simple 20-line change to how A/B testing works, **that you can implement today**, you can _always_ do better than A/B testing &#8212; sometimes, two or three times better. This method has several good points:

  * It can reasonably handle more than two options at once.. Eg, A, B, C, D, E, F, G, Ã¢ï¿½Â¦
  * New options can be added or removed at any time.

But the most enticing part is that **you can set it and forget it**. [If your time is really worth $1000/hour][3], you really don&#8217;t have time to go back and check how every change you made is doing and pick options. You don&#8217;t have time to write rambling blog entries about how you got your site redesigned and changed this and that and it worked or it didn&#8217;t work. Let the algorithm do its job. This 20 lines of code automatically finds the best choice quickly, and then uses it until it stops being the best choice.

## The Multi-armed bandit problem

<div align="center">
  <img src="http://research.microsoft.com/en-us/projects/bandits/MAB-2.jpg" alt="" /><br /> Picture from <a href="http://research.microsoft.com/en-us/projects/bandits/">Microsoft Research</a>
</div>

The multi-armed bandit problem takes its terminology from a casino. You are faced with a wall of slot machines, each with its own lever. You suspect that some slot machines pay out more frequently than others. How can you learn which machine is the best, and get the most coins in the fewest trials?

Like many techniques in machine learning, the [simplest strategy][4] is [hard to beat][5]. More complicated techniques are worth considering, but they may eke out only a few hundredths of a percentage point of performance. One strategy that has been shown to perform well time after time in practical problems is the _epsilon-greedy_ method. We always keep track of the number of pulls of the lever and the amount of rewards we have received from that lever. 10% of the time, we choose a lever at random. The other 90% of the time, we choose the lever that has the highest expectation of rewards.

<pre>def choose():
    if math.random() &lt; 0.1:
        # exploration!
        # choose a random lever 10% of the time.
    else:
        # exploitation!
        # for each lever, 
            # calculate the expectation of reward. 
            # This is the number of trials of the lever divided by the total reward 
            # given by that lever.
        # choose the lever with the greatest expectation of reward.
    # increment the number of times the chosen lever has been played.
    # store test data in redis, choice in session key, etc..

def reward(choice, amount):
    # add the reward to the total for the given lever.
</pre>

## Why does this work?

Let&#8217;s say we are choosing a colour for the &#8220;Buy now!&#8221; button. The choices are orange, green, or white. We initialize all three choices to 1 win out of 1 try. It doesn&#8217;t really matter what we initialize them too, because the algorithm will adapt. So when we start out, the internal test data looks like this.

<table border="1">
  <tr>
    <th>
      Orange
    </th>
    
    <th>
      Green
    </th>
    
    <th>
      White
    </th>
  </tr>
  
  <tr>
    <td>
      1/1 = 100%
    </td>
    
    <td>
      1/1=100%
    </td>
    
    <td>
      1/1=100%
    </td>
  </tr>
</table>

Then a web site visitor comes along and we have to show them a button. We choose the first one with the highest expectation of winning. The algorithm thinks they all work 100% of the time, so it chooses the first one: orange. But, alas, the visitor doesn&#8217;t click on the button.

<table border="1">
  <tr>
    <th>
      Orange
    </th>
    
    <th>
      Green
    </th>
    
    <th>
      White
    </th>
  </tr>
  
  <tr>
    <td>
      1/2 = 50%
    </td>
    
    <td>
      1/1=100%
    </td>
    
    <td>
      1/1=100%
    </td>
  </tr>
</table>

Another visitor comes along. We definitely won&#8217;t show them orange, since we think it only has a 50% chance of working. So we choose Green. They don&#8217;t click. The same thing happens for several more visitors, and we end up cycling through the choices. In the process, we refine our estimate of the click through rate for each option downwards.

<table border="1">
  <tr>
    <th>
      Orange
    </th>
    
    <th>
      Green
    </th>
    
    <th>
      White
    </th>
  </tr>
  
  <tr>
    <td>
      1/4 = 25%
    </td>
    
    <td>
      1/4=25%
    </td>
    
    <td>
      1/4=25%
    </td>
  </tr>
</table>

But suddenly, someone clicks on the orange button! Quickly, the browser makes an Ajax call to our reward function `$.ajax(url:"/reward?testname=buy-button");`and our code updates the results:

<table border="1">
  <tr>
    <th>
      Orange
    </th>
    
    <th>
      Green
    </th>
    
    <th>
      White
    </th>
  </tr>
  
  <tr>
    <td>
      2/5 = 40%
    </td>
    
    <td>
      1/4=25%
    </td>
    
    <td>
      1/4=25%
    </td>
  </tr>
</table>

When our intrepid web developer sees this, he scratches his head. What the F*? The orange button is the _worst_ choice. Its font is tiny! The green button is obviously the better one. All is lost! The greedy algorithm will always choose it forever now!

But wait, let&#8217;s see what happens if Orange is really the suboptimal choice. Since the algorithm now believes it is the best, it will always be shown. That is, until it stops working well. Then the other choices start to look better.

<table border="1">
  <tr>
    <th>
      Orange
    </th>
    
    <th>
      Green
    </th>
    
    <th>
      White
    </th>
  </tr>
  
  <tr>
    <td>
      2/9 = 22%
    </td>
    
    <td>
      1/4=25%
    </td>
    
    <td>
      1/4=25%
    </td>
  </tr>
</table>

After many more visits, the best choice, if there is one, will have been found, and will be shown 90% of the time. Here are some results based on an actual web site that I have been working on. We also have an estimate of the click through rate for each choice.

<table border="1">
  <tr>
    <th>
      Orange
    </th>
    
    <th>
      Green
    </th>
    
    <th>
      White
    </th>
  </tr>
  
  <tr>
    <td>
      114/4071 = 2.8%
    </td>
    
    <td>
      205/6385=3.2%
    </td>
    
    <td>
      59/2264=2.6%
    </td>
  </tr>
</table>

### Edit: What about the randomization?

I have not discussed the randomization part. The randomization of 10% of trials forces the algorithm to explore the options. It is a trade-off between trying new things in hopes of something better, and sticking with what it knows will work. There are several variations of the epsilon-greedy strategy. In the epsilon-first strategy, you can explore 100% of the time in the beginning and once you have a good sample, switch to pure-greedy. Alternatively, you can have it decrease the amount of exploration as time passes. The epsilon-greedy strategy that I have described is a good balance between simplicity and performance. Learning about the other algorithms, such as UCB, Boltzmann Exploration, and methods that take context into account, is fascinating, but optional if you just want something that works.

## Wait a minute, why isn&#8217;t everybody doing this?

Statistics are hard for most people to understand. People distrust things that they do not understand, and they especially distrust machine learning algorithms, even if they are simple. Mainstream tools don&#8217;t support this, because then you&#8217;d have to educate people about it, and about statistics, and that is hard. Some common objections might be:

  * Showing the different options at different rates will skew the results. (No it won&#8217;t. You always have an estimate of the click through rate for each choice)
  * This won&#8217;t adapt to change. (Your visitors probably don&#8217;t change. But if you really want to, in the reward function, multiply the old reward value by a forgetting factor)
  * This won&#8217;t handle changing several things at once that depend on each-other. (Agreed. Neither will A/B testing.)
  * I won&#8217;t know what the click is worth for 30 days so how can I reward it?

## More blog entries

 [1]: http://research.google.com/search.html#q=bandit
 [2]: http://research.microsoft.com/en-us/projects/bandits/
 [3]: http://blog.asmartbear.com/value-time.html
 [4]: http://www.cs.mcgill.ca/~vkules/bandits.pdf
 [5]: http://www.cs.nyu.edu/~mohri/pub/bandit.pdf