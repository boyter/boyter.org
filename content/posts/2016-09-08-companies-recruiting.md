---
title: To all Companies Currently Recruiting
author: Ben E. Boyter
type: post
date: 2016-09-08T22:29:19+00:00
url: /2016/09/companies-recruiting/
nkweb_code_in_head:
  - default
nkweb_Use_Custom_js:
  - default
nkweb_Use_Custom_Values:
  - default
nkweb_Use_Custom:
  - 'false'
categories:
  - Interviews
  - Story

---
I am writing this on behalf of all developers/engineers out there. Please stop with the take home coding challenge questions. Really. Just stop it. They are a lazy and frankly an unprofessional way of sorting the wheat from the chaff. Before closing your browser in disgust hear me out on this one and hopefully I can convince you of the error of your ways.

There has become an alarming trend these days of companies during the hiring process to issue lengthy coding challenges in order to prove that the individual they are hiring knows their stuff. I totally understand why you might be doing this but frankly its flawed. Lets go through several reasons why.

1. It shows that you have a lack of regard for the individuals time. This is a serious red flag. After all if you fail to respect my time why should I respect yours? Consider it this way, for every hour of time that your test takes you are taking away 1 hour of that persons family/rest/sleep/eating/hobby time. What is your commitment in this situation? If you aren't willing to invest the time in the hiring process then why should we? Sure you need to review the code (and hopefully give feedback) but that usually takes less than 15 minutes (yes I have done this and you can do it very quickly). The time investment balance is horribly skewed in your favor, which starts the relationship off to a bad start. Lets also consider those who do consulting or contracting outside. If you ask them to do a 3 hour coding challenge then you are asking them to forgo somewhere in the region of $300-700. Even worse is that usually at the end of these tests all you get back is "Pass" or "Fail". Even when you do give some feedback there is no way it pays back the amount of time that went in.

2. Long tests are irrelevant anyway. When you set someone up to solve a problem that takes several hours you are setting them up to fail. The test you set is usually set up such that you are looking for a specific answer and only that answer. It might be obvious to you that using the strategy pattern is the best way to solve your test, but what about those who's development backgrounds require business logic rules to be user editable and hence live in a database where it can be modified? You are also going to nitpick over every little detail in a classic case of bike shedding. "They didn't clean up some spaces!" "They didn't comment this method!" "They did comment this method!" Even aware of this problem I still find myself falling into the trap of nitpicking over the small stuff that usually doesn't matter. You are going to be investing time in training them how you want things anyway so why expect them to know it without even working with you?

3. It's going to drive away talented individuals. I am not counting myself in this category but I know of many talented dev's who simply refuse to do any sort of test. Why? They have a huge on-line portfolios of work they have previously done. Why do you even ask for our Github/Gitlab profiles if not to look at them? Surely 5 minutes of looking though would let you know if this person is a pretender or knows their stuff.

4. The hiring process is skewed towards the hirer. People looking for work are usually in one of two situations. Either they have a role and are looking around or they don't have one. Lets consider the risk for both groups.

For those with a job they will need to resign from their current position to take an opportunity with you. There is usually a probation period following the hiring that either party can say "No this isn't for me lets agree to be friends". The hiree is the one taking on the largest risk in this situation. They have already left what possibly was a stable situation for an unstable situation. The company takes on the risk of potentially investing in someone and they leave. Realistically though the company is in the position to hire so renumeration is the least of their problems. For the hiree though the potential is that they join and after a month get the boot. They are now without income and back to looking for a job, only now they are in the latter category.

For those without a job, they have the situation that they might find employment and in doing so passing on other opportunities only to get the boot after a few months. Once again its skewed towards the company.

5. They are easily gamed. A quick check on freelancer or other such sites shows that I can probably buy a solution to any coding challenge you have for less than $300. For a job with a steady pay-check even if its only for a few months (before you find out I can't code a damn) this is a no brainer especially if I know my coding chops aren't up to standard. But why pay at all? A lot of the solutions are posted on on-line forums and Github already. Heck just ask your best mate who happens to know their stuff to do it for you. Whats the cost to the organization here? Well assuming you do hire me based on my fraudulent test I could lurk in the company for months, either contributing nothing or perhaps causing all sorts of damage. At the very least you have paid several months salary.

A-hah you say! I can defeat what you have written above! I will just have another test during the interview process I can hear you thinking. DING DING DING WINNER! However, if you are going to do that anyway why not drop the initial challenge? After all what are you gaining?

Here's what I propose. Bring the person you want to interview in and have them actually code on a machine in front of you. Work through a few simple problems together. It doesn't need to be complex. Ask them to write a function that reverses all the words in a string but not the string itself. Ask them how to find elements that existing in list A that are not in B. Ask them why they implemented certain patterns, how did they decide on data types, why did they comment/not comment a method. Let them know in advance that this is what is going to happen and what will be expected. You will learn far more in this short investment of time then with any coding challenge. If you want to get more in depth then why not offer to pay them for a single day to come in and actually work. The monetary cost will be less than making the wrong hire and you both get to decide if things are going to work out.

At the very least if you do need to screen candidates, have a very short coding test. Give them a short piece of code, of 20 lines or less and ask them to point out all the flaws in it. It allows you to craft the example to screen for specific strengths as well. For my current employer we have three such examples for Go, Java and React. The idea is that it should take less than 15 minutes for anyone to have a look through and point out the flaws. It also makes it very deterministic as you know ahead of time the flaws. For example the following snippet of Java has 3 obvious issues, those being pokemon exceptions, it will always return 0 and the indenting is not consistent. Be sure during your interview to revisit the code and talk it though with them. The candidate will be familiar with it at this point which helps overcome the interview nerves.

The best interview process I have been with to date was actually the Microsoft one for a intern role many many moons ago. It involved several hours of interviews with different individuals discussing different technology roles to try and ascertain the best fit.

When I walked out (I didn't get the role BTW) I felt like a better person. Not only were the discussions interesting, I learnt a lot from those conducting them and I felt like my time was valued. They even offered to cover my travel expenses which made me feel like they cared about my time investment. This is how the process is meant to work. Its as much about the person being interviewed as about the company. Consider it an investment in your advertising budget if you are tracking the time investment (yes it is an investment!) as a cost. Good interviews stick with people a long time and GREAT ones make those people want to praise your company.
