import * as pulumi from "@pulumi/pulumi";
import * as azure_native from "@pulumi/azure-native";

// Import the program's configuration settings.
const config = new pulumi.Config();
const path = config.get("path") || "../src/public";
const appName = config.get("appName") || pulumi.getProject();
const environmentName = config.get("environmentName") || pulumi.getStack();
const prefix = `${appName}-${environmentName}`;
const indexDocument = config.get("indexDocument") || "index.html";
const error404Document = config.get("error404Document") || "404.html";

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// These are easily shared resources that should split into their own project/stack if you have more than one site.
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const resourceGroup = new azure_native.resources.ResourceGroup(`${prefix}-rg`, {});

// Create a blob storage account.
const account = new azure_native.storage.StorageAccount(`${prefix}-sa`, {
    accountName: `${prefix}-sa`, //passing direct because the character limit here
    resourceGroupName: resourceGroup.name,
    kind: "StorageV2",
    sku: {
        name: "Standard_LRS",
    },
    enableHttpsTrafficOnly: true,
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Shared end
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Configure the storage account as a website.
const website = new azure_native.storage.StorageAccountStaticWebsite(`${prefix}-website`, {
    resourceGroupName: resourceGroup.name,
    accountName: account.name,
    indexDocument: indexDocument,
    error404Document: error404Document,
});

//Potentially, you could deploy with pulumi too using something like this.
//This has the side effect of adding every file into state, so for a static site like this that would 
// 1. Exceed 200 free IaC resources quickly
// 2. Create a lot of metadata for little benefit.  A fair pattern for other use cases though.
/* So with that in mind we'll just use GitHub's CI/CD for this.  Powered by the same ESC OIDC dynamic login.

new synced_folder.AzureBlobFolder(`${prefix}-website-content`, {
    path: path,
    resourceGroupName: resourceGroup.name,
    storageAccountName: account.name,
    containerName: website.containerName,
});
*/

// Export the URLs and hostnames of the storage account and CDN.
export const originURL = account.primaryEndpoints.web;
