
## About This Site
* [Zac.Direct](https://www.zac.direct) is registered via [Squarespace Domains](https://domains.squarespace.com/google-domains)
* Site content is generated via [Hugo](https://gohugo.io/)
* Infrastructure is provisioned via [Pulumi](https://pulumi.com/)
* Site content is hosted directly on [Azure Blob Storage](https://azure.microsoft.com/en-us/services/storage/blobs/)
* Content is load balanced and provided free SSL certificate via [Cloudflare's Content Delivery Network](https://www.cloudflare.com/plans/free/)
* The Azure hosting bill for this site is estimated to run **$2.06 annually**.  If you're not using services like these, you should be!
* The contact form, bot protection, and hosting complexities are all free from [Formspree](https://formspree.io/)

## Moving from Azure to Cloudflare for CDN

Azure is sadly moving away from [stand-alone CDN](https://learn.microsoft.com/en-us/azure/cdn/classic-cdn-retirement-faq) offerings.  Opting instead to put it behind the Front Door SKUs.  If you have any other Azure infrastructure at all I would consider extending the Pulumi code here to provision a Front Door instance and use it.  You could provision 100% of this inside of a Pulumi project, and Front Door is a solid competitor to Cloudflare.

For my purposes, this site's hosting cost has been approximately $5.00 for the last 5 years.  The basic SKU of Azure Front Door being $35/month removes it from consideration for me, and honestly highlights how great Cloudflare is for committing to a free tier for [the last decade or so](https://webmasters.stackexchange.com/questions/88659/how-can-cloudflare-offer-a-free-cdn-with-unlimited-bandwidth), and promising that they always will.

Pulumi offers a [Cloudflare provider](https://www.pulumi.com/registry/packages/cloudflare/), and the full infrastructure provisioning could still be completed entirely with infrastructure-as-code.  I'm manually provisioning it mainly because there is not yet an [OpenID provider](https://www.pulumi.com/docs/pulumi-cloud/access-management/oidc/provider/) for Pulumi ESC to login to Cloudflare.  Pulumi and Cloudflare both innovate quickly and the generic [connector capability is there](https://developers.cloudflare.com/cloudflare-one/identity/idp-integration/generic-oidc/), and so I expect that might change at some point.  For now, the trade off of having to keep a security token rotated instead of handle dynamic logins like I am doing for [GitHub and Azure](https://github.com/zacdirect/core-infrastructure/blob/main/infra/index.ts) just isn't worth it.  If I had multiple domains or wanted the ability to do ephemeral sites for A/B testing features I would elect to manage the Cloudflare infra in this project.  It's too much to justify for a blog that I forget I have for years at a time. 
