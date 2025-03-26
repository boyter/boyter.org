---
title: Building a Atlassian Bitbucket Plugin
date: 2029-03-17
---

So I thought I would try to implement Sloc Cloc and Code into Atlassian's Bitbucket as a plugin. With the marketplace they have it seemed like it would be potentially a good source of mostly passive income. Plus because many developers find Java and Java 8 distasteful it seemed like a good market to get into compared to Wordpress for example.

To start vist the following and follow the instructions for your OS of choice. I am using Windows with WSL so I actually ended up following the guid for both Linux and Windows and can safely report both worked flawlessly.

<https://developer.atlassian.com/server/framework/atlassian-sdk/set-up-the-atlassian-plugin-sdk-and-build-a-project/>

Keep in mind you need a good internet connection and some free time as this process takes a very long time to get started. Once setup it will create a series of command line tools for you to use which I have listed below.```
atlas-clean                                atlas-create-confluence-plugin             atlas-create-jira5-plugin                  atlas-debug                                atlas-remote-test
atlas-clean.bat                            atlas-create-confluence-plugin.bat         atlas-create-jira5-plugin.bat              atlas-debug.bat                            atlas-remote-test.bat
atlas-cli                                  atlas-create-confluence-plugin-module      atlas-create-jira-plugin                   atlas-help                                 atlas-ruin
atlas-cli.bat                              atlas-create-confluence-plugin-module.bat  atlas-create-jira-plugin.bat               atlas-help.bat                             atlas-ruin.bat
atlas-clover                               atlas-create-crowd-plugin                  atlas-create-jira-plugin-module            atlas-install-plugin                       atlas-run
atlas-clover.bat                           atlas-create-crowd-plugin.bat              atlas-create-jira-plugin-module.bat        atlas-install-plugin.bat                   atlas-run.bat
atlas-compile                              atlas-create-crowd-plugin-module           atlas-create-plugin                        atlas-integration-test                     atlas-run-standalone
atlas-compile.bat                          atlas-create-crowd-plugin-module.bat       atlas-create-plugin.bat                    atlas-integration-test.bat                 atlas-run-standalone.bat
atlas-create-bamboo-plugin                 atlas-create-fecru-plugin                  atlas-create-refapp-plugin                 atlas-mvn                                  atlas-unit-test
atlas-create-bamboo-plugin.bat             atlas-create-fecru-plugin.bat              atlas-create-refapp-plugin.bat             atlas-mvn.bat                              atlas-unit-test.bat
atlas-create-bamboo-plugin-module          atlas-create-fecru-plugin-module           atlas-create-refapp-plugin-module          atlas-package                              atlas-update
atlas-create-bamboo-plugin-module.bat      atlas-create-fecru-plugin-module.bat       atlas-create-refapp-plugin-module.bat      atlas-package.bat                          atlas-update.bat
atlas-create-bitbucket-plugin              atlas-create-home-zip                      atlas-create-stash-plugin                  atlas-release                              atlas-version
atlas-create-bitbucket-plugin.bat          atlas-create-home-zip.bat                  atlas-create-stash-plugin.bat              atlas-release.bat                          atlas-version.bat
atlas-create-bitbucket-plugin-module       atlas-create-jira4-plugin                  atlas-create-stash-plugin-module           atlas-release-rollback
atlas-create-bitbucket-plugin-module.bat   atlas-create-jira4-plugin.bat              atlas-create-stash-plugin-module.bat       atlas-release-rollback.bat

```

`atlas-run` is probably the most useful and the one you are likely to use the most.

`atlas-help` is useful for groking all of the other tools.

As far as I can tell atlas appears to be for the most part a collection of shell scripts which wrap around maven with some specific requirements for Atlassian. I did not see anything nefarious from what I saw.

On linux they appear to just be links to `/usr/share/atlassian-plugin-sdk-8.0.7/bin` where the actual scripts live.

As with any maven project, if you import anything through atlas commands or modifying the `pom.xml` file you will need to download new dependancies the moment you run another atlast command or through your IDE if you have maven support. As such you are going to have a better time with a solid internet connection.

<https://developer.atlassian.com/server/bitbucket/how-tos/beginner-guide-to-bitbucket-server-plugin-development/>

<https://developer.atlassian.com/server/bitbucket/tutorials-and-examples/decorating-the-user-account/>

If you follow this article, I suggest after creating the plugin to run `atlas-run` and get everything working. This will download a bunch of dependancies and ensures you are ready to rock and roll which you can confirm by browsing to <http://localhost:7990/bitbucket/dashboard> when it has finished starting.

<https://marketplace.atlassian.com/addons/app/bitbucket>
<https://developer.atlassian.com/platform/marketplace/creating-a-marketplace-listing/>
