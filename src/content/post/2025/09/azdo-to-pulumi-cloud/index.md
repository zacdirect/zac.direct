---
title: "Azure DevOps and Pulumi Cloud"
date: 2025-09-26T13:08:03-05:00
description: "How to connect Azure DevOps Pipelines to Pulumi Cloud using OIDC"
featured: true
draft: false
toc: false
usePageBundles: false
thumbnail: post/2025/09/azdo-to-pulumi-cloud/azdo-pulumi.png
tags:
- pulumi
- azuredevops
---
I feel like most of my career half of the unexpected outages have been caused by a certificate expiring, a token expiring, a DNS misconfiguration, or a BGP route misconfiguration.  This day in age, you have to go out of your way to find a reason you still have to manually renew certificates, and [OIDC](https://openid.net/developers/how-connect-works/) is slowly but surely solving the same thing for exchanging tokens across cloud services.

Assuming a cloud service supports an OIDC client you can connect another cloud service to it, configure both sides to expect the set of information, and then you have a perpetual handshake of short-lived tokens using service accounts.  If they happen to leak, they're probably already expired, and you never have to manually rotate them.  It feels like magic, and like any good spell, getting the incantation just right can be a challenge.

> "I've got OIDC between Azure DevOps, Azure, and Pulumi Cloud all figured out.  
> I can't find anything online about how to do this specifically for azdo, and so I'll probably end up writing a blog post about it."

> > "How much of a pain in the ass was it?"

> "I reached 'the commits of despair' place."

![](/post/2025/09/azdo-to-pulumi-cloud/commits-of-despair.png "The commits of despair")

## Azure DevOps Pipelines
Azure DevOps doesn't have the new shine of GitHub Actions, or the steady development of GitLab CI/CD pipelines, but it still has plenty of things to love.  I think it does templating in a way that's easier to understand than either of those products, and runtime failures can be significantly easier to debug.  I expect most of it's audience doesn't choose it for features though, and are instead taking an easy migration path from on-prem Team Foundation servers.

Those old roots run really deep, and that means a lot of support for a lot of different auth services.  So when you want to plan out a token exchange the first obstacle is figuring out [which one you even need](https://learn.microsoft.com/en-us/azure/devops/pipelines/build/variables?view=azure-devops&tabs=yaml).  Fortunately the folks at Microsoft have recently breathed some new life into Azure DevOps and provided a sample project showing how to handle OIDC between [Azure DevOps and Azure](https://learn.microsoft.com/en-us/samples/azure-samples/azure-devops-terraform-oidc-ci-cd/azure-devops-terraform-oidc-ci-cd/). Which I went ahead and [took a shot at porting to Pulumi](https://github.com/zacdirect/azure-devops-pulumi-oidc-ci-cd), and that gave me a solid foundation to work from.

What the source project didn't make clear is what exactly I should do if Azure DevOps was the client to another provider, such as Pulumi Cloud.  I cannot find any documentation from Microsoft on what content they put in Azure DevOps Pipelines minted tokens, and so, as the commits of despair show, I got here from printing out the tokens and looking at them.

Here's my pipeline step for handling the mix of Azure DevOps built-in variables, and issuing a request to Pulumi Cloud in order to get back the typical `PULUMI_ACCESS_TOKEN` that any pulumi command will expect.

```yaml
steps:
- task: AzureCLI@2
  displayName: 'Azure DevOps OIDC to Pulumi Cloud'
  inputs:
    azureSubscription: '$(AZURE_SUBSCRIPTION)'
    scriptType: bash
    scriptLocation: inlineScript
    inlineScript: |
      OIDC_REQUEST_URL="${SYSTEM_OIDCREQUESTURI}?api-version=7.1"
      
      RESP=$(curl -sS -X POST \
        -H "Authorization: Bearer $(System.AccessToken)" \
        -H "Content-Type: application/json" \
        -H "Content-Length: 0" \
        "$OIDC_REQUEST_URL")
      
      PULUMI_OIDC_TOKEN=$(echo "$RESP" | jq -r '.oidcToken')
      
      EXCHANGE=$(curl -sS \
      -H "Accept: application/vnd.pulumi+8" \
      -H "Content-Type: application/json" \
      --request POST \
      --data "{
        \"audience\":\"urn:pulumi:org:$(PULUMI_ORG)\",
        \"grant_type\":\"urn:ietf:params:oauth:grant-type:token-exchange\",
        \"subject_token_type\":\"urn:ietf:params:oauth:token-type:id_token\",
        \"requested_token_type\":\"urn:pulumi:token-type:access_token:organization\",
        \"expiration\":3600,
        \"scope\":\"\",
        \"subject_token\":\"$PULUMI_OIDC_TOKEN\"
      }" \
      https://api.pulumi.com/api/oauth/token)
      
      PULUMI_ACCESS_TOKEN=$(echo "$EXCHANGE" | jq -r '.access_token')
      
      echo "##vso[task.setvariable variable=PULUMI_ACCESS_TOKEN;issecret=true]$PULUMI_ACCESS_TOKEN"
```

Adding this to any pipeline will give you the basis to refer to that environment variable in any subsequent step.  The easiest way to test this is to use a simple whoami command that Pulumi makes available.

```yaml
- script: |
    pulumi whoami
  displayName: 'Verify Pulumi Authentication'
  env:
    PULUMI_ACCESS_TOKEN: $(PULUMI_ACCESS_TOKEN)
```

That step should with the above example for organization based access should echo whatever your organization name is.  At least once you've configured the Pulumi Cloud side to know what to expect.

## Pulumi Cloud

Pulumi supports any number of issuers and have the nuances of their support are [documented here](https://www.pulumi.com/docs/pulumi-cloud/access-management/oidc-client/).  The important thing to know is that the Azure DevOps side will issue their tokens using the `vstoken.dev.azure` url.  This is mentioned in a recent [release note](https://learn.microsoft.com/en-us/azure/devops/release-notes/2025/sprint-253-update) from them.

Armed with the above information I was able to complete a connection using the following steps:

### 1. Register OIDC Issuer  
Go to **Organization Settings > OIDC Issuers** and click **Register issuer**. Fill in:

- **Name**: e.g. `azdo-zacdirect`  
- **URL**:  `https://vstoken.dev.azure.com/{organizationId}`
  Replace `{organizationId}` with your Azure DevOps organization’s identifier.
- **Max expiration (seconds)**: `3600`  

Your organization ID is available via some API calls and by inspecting the tokens, but the easiest way is to find the GUID under the billing page in Azure DevOps itself.

![](/post/2025/09/azdo-to-pulumi-cloud/azdo-orgid.png "The Azure Subscription ID on the billing section is your organization id")

Once submitted, Pulumi Cloud accepts tokens from that issuer URL.

![](/post/2025/09/azdo-to-pulumi-cloud/pulumi-cloud-issuer-config.png "Pulumi Cloud screenshot showing the info from above")

### 2. Add authorization policies  
Inside your new issuer, click **Add policy**. Configure:

- **Decision**: `Allow`  
- **Token type**: `organization`  
- **Rules**:  
  - `aud` > `api://AzureADTokenExchange`  
  - `iss` > `https://vstoken.dev.azure.com/{organizationId}`  
  - `sub` > `p://zacharycook/ZacDirect/*`

This lets *any* pipeline under that project request a Pulumi token with a standard permission set.  You may wish to scope admin access to only a certain project. To do so, adjust what the pipeline is requesting via its CURL command and the corresponding Pulumi Cloud policy.

![](/post/2025/09/azdo-to-pulumi-cloud/pulumi-cloud-policies.png "Pulumi Cloud Policies")

Be sure to set the default policy rules to 'Allow' and the token type to 'Organization' unless you've already set something different in the pipeline's request curl, such as using a personal token type.

## Conclusion

I expect most of you arrived here via an internet search.  I hope this helped you out!
