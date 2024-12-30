---
title: 'Foot = Shot'
date: 2012-06-26T00:28:00.002-05:00
draft: false
url: /2012/06/foot-shot.html
tags: 
- development
- databases
---

Things never to do again:  
Do not under any circumstance use SELECT DISTINCT to return unique results from a database because a subquery or join is causing duplicate rows.  You are getting duplicate rows because the subquery or join isn't as accurate as it needs to be... stop using this as a quick fix it only causes bigger pains later.