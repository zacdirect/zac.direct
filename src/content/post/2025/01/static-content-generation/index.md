---
title: "Static Content Is Awesome"
date: 2025-01-07T23:04:29-06:00
description: "Static sites are really nice to use if you can find a way to automate updating their content references."
featured: true
draft: false
toc: false
usePageBundles: false
thumbnail: /post/2025/01/static-content-generation/static-site.png
tags:
- hugo
- devops
- pulumi
---

I have a weird love of static content.  Maybe it's a bit of nostalgia from getting my start editing html and posting it to [Tripod](https://en.wikipedia.org/wiki/Tripod_(web_hosting)), but I think the appreciation is mostly from a consumer standpoint.  I like being able to see every call and script that makes up a site within my browser, and I like being able to save content to an offline folder if I choose to.  I love having the full context of how the site works and being able to adjust it easily with any browser extensions or preferences I have.  It doesn't hurt that despite the tendency to [look bland and generic](https://everybootstrap.site/) the content is well presented and loads extremely fast.

My day-to-day hasn't offered much opportunity to explore strictly static content.  I've either been writing dynamic applications or supporting them.  Every concern I have is a few degrees away from worrying about how to scale a queue or database instance to ensure adequate performance or  [eventual consistency](https://en.wikipedia.org/wiki/Eventual_consistency).  I try not to bring too much of the same kind of problems into my personal projects and so that has made generating static content a personal requirement.  My first iteration was born out of an interest to lean into .net core, and I found [Wyam](https://github.com/Wyamio/Wyam) a very interesting project made for the purpose of generating static content.  Scott Hanselman even had [a nice blog post](https://www.hanselman.com/blog/exploring-wyam-a-net-static-site-content-generator) about exploring it, and so decision made, I generated the site in Wyam.

![](/post/2025/01/static-content-generation/blogger.png "Blogger Posts")

The blog itself was something I started on Blogger what feels like one-hundred-years-ago, and at the time I didn't feel compelled enough to bring my posts over to the static site generator.  I simply setup the site, bought a domain name with Google Domains, made a blog subdomain that redirected to blogger and that was that.  In the time since, Google has perpetually stagnated, and as part of that stagnation they've been selling off and understaffing huge parts of their business.  They sold to their domains product to Squarespace, which was [the gift that kept on giving](https://cybersecuritynews.com/hackers-squarespace-customers/). I had used a free Azure account to publish the content to a storage account and use [a now bankrupt CDN feature](https://learn.microsoft.com/en-us/azure/cdn/edgio-retirement-faq) to distribute it.  My simple Google Analytics tracking [was eaten by a forced migration to GA4](https://www.cmswire.com/digital-marketing/is-googles-forced-ga4-migration-a-power-grab-in-disguise/).  It became clear that my platform dependencies were demanding that I either let this go or give some time and attention to it.

{{< image src="gopher-hero.png" position="float-right" alt="Hugo's Gopher Hero.">}}
I decided to rehab this old thing, and found that even Wyam isn't around anymore; Wyam is now the different but still very interesting [Statiq](https://github.com/statiqdev). With even my core content needing some form of migration I reviewed the current landscape of static site generators, and found [Hugo](https://gohugo.io/).  Hugo was on the scene the last time I was working on my personal site, but [Hugo Clarity](https://github.com/chipzoller/hugo-clarity) was not, and as a primarily backend engineer I have always absolutely loved [Clarity](https://clarity.design/) and it's efforts to give clear examples of good design.

The migration from Wyam to Hugo was [fairly straightforward](https://github.com/zacdirect/zac.direct/pull/1), and gave me enough confidence to use a a few different Blogger-to-markdown converters to get the blog content ported over as well.  These last few years have really put a distaste for platform reliance in my mouth, and I don't have high hopes for Blogger's continued existence.  Old and boring as it may be, my old content is still mine and I'd like to bring it along.  All that I needed to do next was find a host for it, and despite the CDN shenanigans I still really enjoy Azure and wanted to keep hosting my content there.  Unfortunately, the previously free CDN was replaced by a $35/month Azure Front Door SKU, and I have spent maybe $5 on hosting this site's entire existence.

{{< youtube gl99t4S3ChM >}}
After the last few years of getting emails of all the neat services I use going away I was about ready to go back a basic plan with [HostGator](https://www.hostgator.com/) and start using WS_FTP to upload my content like it's 1999.  They might not be getting mentioned in too many blogs, but they've been doing their thing consistently for decades and [acquisitions haven't stopped them](https://en.wikipedia.org/wiki/HostGator).  I think this video qualifies as ASMR if you're a web development nerd in their 40's.

I spend most my time in AWS these days and I know publishing to an S3 bucket protected by CloudFront is a dirt cheap CDN solution.  I personally prefer Azure to AWS though, and while I think their bundling CDN's into Front Door makes sense for a business it does cut out the free tier seekers like myself.  A free tier like Cloudflare's CEO has said [they're committed to keeping](https://webmasters.stackexchange.com/questions/88659/how-can-cloudflare-offer-a-free-cdn-with-unlimited-bandwidth).  I'm not sure I trust that as much as the $1.50 price tag on a Costco hotdog, but it was good enough to move to.  I setup an account and completed a few manual configurations then got to work using GitHub Actions and Pulumi to handle publishing.  This was my first opportunity to learn GitHub Actions, and so that process [was a bit messy](https://github.com/zacdirect/zac.direct/pull/5), but I got it over the finish line.  Let me assure you that if you're just picking up GitLab, Azure DevOps, or GitHub Actions you do not need to stress about a clean commit history.  That's what forks and squash merges are for.
