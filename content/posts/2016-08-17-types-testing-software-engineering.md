---
title: Types of Testing in Software Engineering
author: Ben E. Boyter
type: post
date: 2016-08-17T22:42:37+00:00
url: /2016/08/types-testing-software-engineering/
nkweb_code_in_head:
  - default
nkweb_Use_Custom_js:
  - default
nkweb_Use_Custom_Values:
  - default
nkweb_Use_Custom:
  - 'false'
categories:
  - Testing
  - Unit Testing

---
There are many different types of testing which exist in software engineering. They should not be confused with the test levels, unit testing, integration testing, component interface testing, and system testing. However the different test levels may be used by each type as a way of checking for software quality.

The following are all different types of tests in software engineering.

_A/B_
  
A/B testing is testing the comparison of two outputs where a single unit has changed. It is commonly used when trying to increase conversion rates for online websites. A real genius in this space is [Patrick McKenzie][1] and a few very worthwhile articles to read about it are [How Stripe and AB Made me A Small Fortune][2] and [AB Testing][3]

_Acceptance_
  
Acceptance tests usually refer to tests performed by the customer. Also known as user acceptance testing or UAT. Smoke tests are considered an acceptance test.

_Accessibility_
  
Accessibility tests are concerned with checking that the software is able to be used by those with vision, hearing or other impediments.

_Alpha_
  
Alpha testing consists of operational testing by potential users or an independent test team before the software is feature complete. It usually consists of an internal acceptance test before the software is released into beta testing.

_Beta_
  
Beta testing follows alpha testing and is form of external user acceptance testing. Beta software is usually feature complete but with unknown bugs.

_Concurrent_
  
Concurrent tests attempt to simulate the software in use under normal activity. The idea is to discover defects that occur in this situation that are unlikely to occur in other more granular tests.

_Conformance_
  
Conformance testing verifies that software conforms to specified standards. An example would checking a compiler or interpreter to see if it will work as expect against the language standards.

Compatibility
  
: Checks that software is compatible with other software on a system. Examples would be checking the Windows version, Java runtime version or that other software to be interfaced with have the appropriate API hooks.

_Destructive_
  
Destructive tests attempt to cause the software to fail. The idea being to check that software continues to work even with given unexpected conditions. Usually done through fuzzy testing and deliberately breaking subsystems such as the disk while the software is under test.

_Development_
  
Development testing is testing done by both the developer and tests during the development of the software. The idea is to prevent bugs during the development process and increase the quality of the software. Methodologies to do so include peer reviews, unit tests, code coverage and others.

_Functional_
  
Functional tests generally consist of stories focused around the users ability to perform actions or use cases checking if functionality works. An example would be "can the user save the document with changes".

Installation
  
: Ensures that software is installed correctly and works as expected on a new piece of hardware or system. Commonly seen after software has been installed as a post check.

_Internationalisation_
  
Internationalisation tests check that localization for other countries and cultures in the software is correct and inoffensive. Checks can include checking currency conversions, word range checks, font checks, timezone checks and the like.

_Non functional_
  
Non functional tests test the parts of the software that are not covered by functional tests. These include things such as security or scalability which generally determine the quality of the product.

_Performance / Load / Stress_
  
Performance load or stress testing is used to see how a system performance under certain high or low workload conditions. The idea is to see how the system performs under these conditions and can be used to measure scalability and resource usage.

_Regression_
  
Regression tests are an extension of sanity checks which aim to ensure that previous defects which had a test written do not re-occur in a given software product.

_Realtime_
  
Realtime tests are to check systems which have specific timing constraints. For example trading systems or heart monitors. In these case real time tests are used.

_Smoke / Sanity_
  
Smoke testing ensures that the software works for most of the functionality and can be considered a verification or acceptance test. Sanity testing determines if further testing is reasonable having checked a small set of functionality for flaws.

_Security_
  
Security testing concerned with testing that software protects against unauthorised access to confidential data.

_Usability_
  
Usability tests are manual tests used to check that the user interface if any is understandable.

 [1]: http://www.kalzumeus.com/
 [2]: http://www.kalzumeus.com/2012/08/06/stripe-and-ab-testing-made-me-a-small-fortune/
 [3]: https://training.kalzumeus.com/newsletters/archive/ab_testing