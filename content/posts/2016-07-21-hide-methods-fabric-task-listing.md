---
title: How to Hide Methods From Fabric Task Listing
author: Ben E. Boyter
type: post
date: 2016-07-21T22:34:49+00:00
url: /2016/07/hide-methods-fabric-task-listing/
nkweb_code_in_head:
  - default
nkweb_Use_Custom_js:
  - default
nkweb_Use_Custom_Values:
  - default
nkweb_Use_Custom:
  - 'false'
categories:
  - Python Fabric

---
Occasionally you may want to hide a method from appearing inside the fabric listing of available tasks. Usually its some sort of helper method you have created that is shared by multiple tasks. So how to hide it? Simply prefix with _ 

For example,

    
    def _apt_get(packages):
        '''Makes installing packages easier'''
        sudo('apt-get update')
        sudo('apt-get -y --force-yes install %s' % packages)
    

When listing the fabric tasks this method will no longer appear in the results.