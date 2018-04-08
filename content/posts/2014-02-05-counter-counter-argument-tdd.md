---
title: Counter-counter argument TDD
author: Ben E. Boyter
type: post
date: 2014-02-05T01:00:25+00:00
url: /2014/02/counter-counter-argument-tdd/
categories:
  - Unit Testing

---
The following is taken from my response to a Hacker News comment. The comment follows (quoted) and my response below.

_"I will start doing TDD when,_

_1. It is faster than developing without it._
  
_2. It doesn't result in a ton of brittle tests that can't survive an upgrade or massive change in the API that is already enough trouble to manage on the implementation-side- even though there may be no functional changes!_

_Unit tests that test trivial methods are evil because the LOC count goes up"_

<span style="color: #000000; line-height: 1.6;">1. It can be. For something like a standard C# MVC application (Im working on one now) the time taken to spin up Casini or deploy to IIS is far greater then running tests. For something like PHP where you are just hitting F5 and TDD can slow you down. As with most things it depends.</span>

2. If you are writing brittle tests you are doing it wrong.

Increasing LOC (lines of code) isn't always a bad thing. If those increased LOC improve quality then I consider it a worthwhile. Yes it can be more maintenance, but we know the cost of catching bugs in development is much cheaper then in production.

Mocking isn't as bad as its been made out to be. Yes you can overmock things (a design anti-pattern), but that should be a sign of code smell and you should be re-factoring to make it simpler. If you cant re-factor and you cant easily mock then consider if you really need to test it. In my experience things that are hard to mock and cannot be re-factored usually shouldn't be tested_._

Exception being legacy code, but we are talking about TDD here which usually means greenfield development or else it would have tests already.

Unit testing does NOT promote 100% coverage. People using unit tests as a measure promote this. Sometimes its worth achieving, and sometimes its not. Use common sense when picking a unit test coverage metric. I have written applications with close to 100% coverage such as web-services and been thankful for it when something breaks and I needed to fix it. I have also written applications with no more then 20% over the critical methods (simple CRUD screens). Use common sense, testing simple getters and setters is probably a waste of time so don't do it.

Unit testing isn't all about writing tests. Its also about enforcing good design. Code that's easily testable is usually good code. You don't have to have tests to have testable code, but if you are going to that effort anyway why not add where they can add value and provide you with a nice safety harness?

<span style="color: #000000;">Most of the issues with unit tests come with people preaching that they are a silver bullet. For specific cases they can provide great value and increase development speed. Personally I will continue to write unit tests, but only where my experience leads me to believe they will provide value.</span>