---
title: Expert Excuses for Not Writing Unit Tests
date: 2018-11-26
---

Management has cracked it. "Start writing unit-tests!", "We need to improve code quality!" they cry. You however are a ninja 1% programmer and have no need for this. Sometimes however you need to play the system to get what is right. Here is a brief document to help with that.

This is going to sound strange but in this goal Wally of Dilbert https://en.wikipedia.org/wiki/Wally_(Dilbert) must be your inspiration.

For any piece of code the following excuses are applicable. Feel free to use any at random or in order.

## Generic Fall-back Excuses

 - The code is too complex to unit test.
 - The code is too simple to unit test.
 - There's no point unit testing for code that doesn't change.
 - This is a destructive process, so it cannot be unit tested.
 - Unit tests won't tell me if the application actually works.
 - I can test this stuff myself without writing code for it.
 - The client is paying for a deliverable not unit tests.
 - Thats QA's problem.
 - Unit tests are just assertions in disguise.
 - Unit testing was a staple of the FORTRAN days.
 - Unit testing is not about finding bugs.
 - Measuring programming progress by lines of code is like measuring aircraft building progress by weight. - Bill Gates
 - There is an exception to every rule, and we must of course be flexible.
 - Never ascribe to malice, that which can be explained by incompetence. - Napoleon
 - Testing is for communists.


## The Promise of Bad Tests

The first line of defense against unit testing is to fight before the decision to write them is even made. If you can win this argument you are ahead of anything else. If you are starting from an existing code-base you are in the enviable position have being able to have a few additional arguments.

### Testing leads to bad design

A lot of arguments point out that testing can lead to a better design. Use this against itself. It can always produce a crappy design all about accommodating the tests and not the requirements. If you have clearly specified roles be sure to point out this is is taking work away from the architects and project leads. Always use the argument that if you want to test then every method needs to be public which makes things worse.

### Adding of cost
	LOC which is discussed later
	Wring them takes too long
	There's no point unit testing for code that doesn't change
	Fixing Bugs
	Cost of increasing LOC
		Measuring programming progress by lines of code is like measuring aircraft building progress by weight. - Bill Gates
		Use this argument
		Many studies do show a rough correlation between LOC and the overall cost and length of development, and between LOC and number of defects. So while it may not be a precise indication of anything (in particular, "progress"), it is not a completely useless metric. The lower your LOC measurement is, the better off you probably are.
	
### Faking It

So management is coming down hard on you or your team is all brainwashed. What do you do now? The first thing to do is start faking your tests as quickly as possible. Don't worry. A few weeks of creative code should help us 

#### Auto Generating

If you have any code that is generated somehow you want to hook into this process as quickly as possible. There is a land grab afoot and you need to own this process. Modify the code ASAP and ensure that the next git blame is all yours. A good way to achieve this is to switch the newlines from unix to windows and back, or apply an aggressive code linter. If neither are possible comment the code extensively (with slightly wrong comments!) so it looks like you know the most about it.

With the land grab won time to work. Modify your generator process to generate tests to verify the generated code. Be creative with this but play the long con. You want initially to generate just a few tests. This is especially important if someone has setup a CI/CD system. As time goes on have the code generate more and more tests. Slowly add enough tests to start impacting the test cycle. With this in place wait till there is an important deadline. Then strike. Deliberately slow the tests down. Keep doing this until the build process is so slow it is unbearable. This has a twofold effect. The first is you should be able to score a sweet upgrade on your machine. The second is that the tests will no longer be run locally. This is excellent news as everyone will begin to check in code without running their own tests as well. Once this becomes the norm, you want to start to introduce subtle bugs. Be sure to blame the process, as had you been able to run the application quickly and verify your changes manually this would never have happened.

Sow seeds of self doubt.

## Learning From Volkswagen and Diesel-gate

Volkswagen intentionally programmed turbocharged direct injection diesel engines to activate certain emissions controls only during laboratory emissions testing. Genius. We can learn from this and make our tests pass always when under a tested condition. The best part is that this already exists! See https://github.com/hmlb/phpunit-vw for PHP and https://github.com/auchenberg/volkswagen for JavaScript. Remember this needs to be a long con. Leave the fix in place for a few weeks/months and then pull it. Better yet remove it a few days before that critical production release. Everyone will be scrambling to make a fix, and you can politely suggest that you skip the pipeline and push straight into production. After all the code was working yesterday right? If the exception is made then you are almost there. Just repeat a few times until skipping the testing pipeline is the normal work-flow. Keep track of how often this is done.

## Shifting Blame

It might come to pass that since you are being forced to test you may become accountable for software quality. You must shoot down this argument as quickly as possible. If you are ever held accountable you are sunk. Lets go through various lines of shifting the blame.

### Its QA's problem

If you have a QA department then play office politics to get them defensive about their jobs. Casually drop into conversations that if you have tests they won't be required. If you don't have one then point out that that a proper QA process can catch 99.99% percent of errors. Cite The Write the Right Stuff to help with this argument http://www.fastcompany.com/28121/they-write-right-stuff 

		Always point out that 

	Blaming other team members

		You need to get 

### Blaming the technology

For whatever framework you are using check their bug reports. There are bound to be quite a few. This can help support your arguments. After all if the tools you are using are buggy how can you be expected to rely on them? If this allows you to create your own so much the better. Be sure to own that project and introduce your own bugs. Blame all issues on the technology itself or on bugs in the language/framework implementation. Also remember to record the really nasty framework bugs and blame them later for random errors.

### How to test the tests?

Argue that you cant test the tests so how can you be sure they actually work? The argument requires some preparation however as someone may point out that mutation testing covers this. The counter argument depends on if they are able to quote what percentage of tests this should help with. If not point out that mutation testing is only 50% effective, at which point it might well be guessing. If they quote with a number such as "Mutation testing catches errors in 70% of the tests" use the counter argument (using you best Homer Simpson impression) "Oh, people can come up with statistics to prove anything. 14% of people know that.". If they persist fall back on the argument that proper QA and design processes catch 99.99% of errors and cite NASA as a source using this article The Write the Right Stuff to help with this argument http://www.fastcompany.com/28121/they-write-right-stuff and suggest hiring a QA department.
		
### Your Language/Framework/Tool Sucks

If you need to fall back to why your technology sucks just search for "Why langage/framework/technology sucks". If you want a head start check out https://wiki.theory.org/YourLanguageSucks for good arguments for most languages. Using a duck typed language? Awesome! Blame it. Be sure to point out how the lack of typing is causing things to fail everywhere and your tests become increasingly flaky. Using a static language? Great! Point out how everything is rigid making it impossible to test. Using Java or C#? Excellent. Make everything final, private and never use an interface. This should make it impossible to test and whats more you can prove it.

### Blaming the process

This is the best argument ever if you have a process driven company. If things aren't working, blame the process. Do it loudly and insist on many meetings about problems in the process. For full marks complain loudly outside of these meetings about how long they are taking too long and if you could just side step everything it would be done by now. Remember that when attacking the process you need to attack everything in it. If part of the process is requirements gathering insist that developers should be involved with the business analyst and project manager. If part of the process is QA insist that the project manager needs to be involved as they are a key stakeholder. At every step try to include as many people as possible. This will slow down development and increase costs. As this happens stakeholders will start to complain about the escalating project costs and time-lines. You can then smoothly suggest dropping writing the tests. Use your previous arguments about doubling up on QA's costs and the increased costs to help. 

### Blaming the requirements

I'm only as good as my requirements! Fluid requirements are your ally. The more often the requirements change the more cost you can allocate to changing tests to meet the new requirements, of course you didn't write any, so use this time for chilling by the water cooler or getting another coffee. Tell anyone who asks you are networking and discussing how to improve quality without increasing costs.

### Blame a lower level, OS / Hardware

The average user will never notice the difference. If you are using a language such as Java blame the runtime environment. A good source to check for things to blame are the release notes. Jot down any promising bug and report all of them as being related to it. This makes you look highly productive and an active go getter! Remember hardware bugs are solid gold. If you ever find one horde it and introduce it into all your tests. It will pay dividends later.

Its worth it to remember the chain of things that it takes to run your code. You can probably blame almost any portion of the chain knowing nobody can ever prove otherwise.

For example, if you are using Java here is a standard chain of components you can attribute blame to.

`Your Program -> Java Compiler -> JVM -> JVM Compiler -> Operating System -> Operating System Compiler -> Hardware Software -> Hardware Software Compiler -> Hardware Itself`


Undermining Managers
	Reading into Reports
		If your manager is worth squat they will be pulling reports from somewhere about bug counts, test coverage, tests run, sucessful test, sucessful builds etc... game them. Ensure to mark all bugs as requirement or process issues. Most bug trackers don't report via email closed issues. Update them after the fact to obscure the cause to something unrelated to the tests.

		The best part is that if they use these reports to measure performance you can game them. Open/Close 50 bug tickets a day and outperform everyone by a mile. 
	
### Creating Diversions
	Introducing subtle bugs.

Read the art of writing unmaintainable code. Apply it. This will not only make things harder to fix ensuring you have a job for life but also make writing tests after the fact impossible for the double whammy. The harder the code is to maintain the harder it is to add tests. Be creative when doing this! A personal favorite,

```
for(int j=0;j<array_len;j+=8){ 
  total += array[j+0]; 
  total += array[j+1]; 
  total += array[j+2]; /* Main body of 
  total += array[j+3];  * loop is unrolled 
  total += array[j+4];  * for greater speed. 
  total += array[j+5];  */ 
  total += array[j+6]; 
  total += array[j+7]; 
}
```

Are you able to spot the issue with this code? 

Some users will use use syntax highlighters (the fools!) which may defeat the above. However ALL syntax highlighters have weaknesses. With some creative code you can trick the highlighter, and leave your bug hidden.

Remember to double down on something like the above. Write MANY unit tests which test the code but do not find the bug. Use this as ammunition later when it is discovered. Point out that following the process did nothing, and you spent all your time writing tests rather then actually testing anything.

This is unlikely, but if you code ever does fail (gotta be someone else's fault?) remember to swallow the error and if you are forced to report on it use a message such as `"Error: Something went wrong ¯\_(ツ)_/¯"`. Never ever ever return the stack trace. Also be sure to reuse the error as much as possible, with slight variations. For example,

 - `"Error: Something went wrong ¯\_(ツ)_/¯"`
 - `"Error: Soemthing went wrong ¯\_(ツ)_/¯"`
 - `"Error Something went wrong ¯\_(ツ)_/¯"`
 - `"Error: Something went wrong ¯_(ツ)_/¯"`
 - `"Error: Something went wong ¯\_(ツ)_/¯"`

Use the above randomly through your code to really make it hard to track things down.


### Test Failing? Delete it!

If you ever find a failing test delete it. You are a 10x developer and don't have time to fix other peoples crap. Make sure to mention that it was flaky or no longer relevant in the commit comment. Make sure at any stand up or meeting you point out how much of a hero you are for cleaning up other peoples mess. Challenge anyone who suggests otherwise by asking what they have fixed recently. If you continue to get pushed on this start muting the tests. This can usually be done inside your CI system or in the code itself. A mixture of both is usually the best solution especially if the tests are in the same file. Remember that you want someone to look in many places to diagnose any issue.

Introducing Unreliability
	If they are reliable why do we have bugs?
	If our goal is 100% reliable why do we shoot for less than 100% coverage?
	How to write flaky tests
		Flaky tests undermine confidence in your test suite and will result in the tests being muted or ignored. Either way you win. Leave temp files around, connections open and generally anything you can think of that will introduce failure conditions into your tests. Take the following example,

{{<highlight python>}}
def writeheartbeat():
    file = open('/tmp/website_heartbeat.txt','w+')
    file.writelines(str(datetime.now()))
    f.close()
{{</highlight>}}

And the corresponding tests

{{<highlight python>}}
def testheatbeatmissing():
    exists = os.path.isfile('/tmp/website_heartbeat.txt')
    assertFalse(exists)

def testheatbeatexists():
    writeheartbeat()
    exists = os.path.isfile('/tmp/website_heartbeat.txt')
    assertTrue(exists)
{{</highlight>}}

The problem with the above is simple. Assuming the tests run in order everything should be fine for the first test run. However on the second run the first test will assume that the heartbeat file will be missing, however as it would have been created from the previous run this test will now begin to fail! Worse still, if the tests run out of order or someone reorganizes them such that the second becomes the first it will start to fail every time. Even if you introduce a clean up task to delete the file if that ever fails perhaps you left the file handle open? You will have a flaky test. Be creative with this. The more external dependencies you have the harder it will be to test correctly.


	What not to test
		If you are forced to write tests you can start by being selective. Tests for setters and getters not only make you 
look good, but for dynamic languages you can go to town testing all sorts of stuff. Be sure that your method expecting an integer fails gracefully when passed an array. With a little creativity you can auto generate most of these. For everything else follow the following rules.

	* Never test any error case because your code is error free
	* Never test return codes becuase it never happens and slows the test suite down
	* Never test anything that requires you to mock. After all mocking is the work of the devil and a classic anti-pattern.
	* Only test for success under ideal situations. You code is a perfect snowflake.
	* Only write integration tests and make them as flaky as possible to further your cause. See how to write flaky tests.
 



