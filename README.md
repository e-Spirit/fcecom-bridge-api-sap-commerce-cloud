# FirstSpirit Connect for Commerce - SAP Commerce Cloud Bridge

## Overview

### Connect for Commerce Bridge API

The bridge API serves as a REST interface which is able to fetch content, product and category information from any shop backend and to display them in reports in the FirstSpirit ContentCreator.

In order to connect the bridge API with a given shop backend a bridge is needed. It acts as a microservice between the shop backend and FirstSpirit. Further information about how to implement and use a bridge can be found in the official [documentation](https://docs.e-spirit.com/ecom/fsconnect-com/FirstSpirit_Connect_for_Commerce_Documentation_EN.html).

For more information about FirstSpirit or Connect for Commerce please use [this contact form](https://www.crownpeak.com/contact-us) to get in touch.

### SAP Commerce Cloud

This project implements the bridge API to connect FirstSpirit and the SAP Commerce Cloud e-commerce platform.

For more information about SAP Commerce Cloud visit [the SAP commerce website](https://www.sap.com/products/crm/e-commerce-platforms.html).
Lean more about their API [here](https://help.sap.com/docs/SAP_COMMERCE/4c33bf189ab9409e84e589295c36d96e/620a19f591cf4846a0160c74754c43b2.html?version=1905&locale=en-US) and [here](https://help.sap.com/docs/SAP_COMMERCE/9d346683b0084da2938be8a285c0c27a/95e7d463fe704627a153685ff6a581e3.html?version=1811&locale=en-US).


## Prerequisites
- Server running node 14 or later
- SAP Commerce Cloud instance
- Access to the [SAP OCC API](https://help.sap.com/docs/SAP_COMMERCE/4c33bf189ab9409e84e589295c36d96e/620a19f591cf4846a0160c74754c43b2.html?version=1905&locale=en-US)
- Access to the [SAP CMS Item API](https://help.sap.com/docs/SAP_COMMERCE/9d346683b0084da2938be8a285c0c27a/95e7d463fe704627a153685ff6a581e3.html?version=1811&locale=en-US)

## Getting Started

### Configuration
The configuration is done by copying the `.env.template` file in the root directory to a `.env` file and editing it.

| Param                   | Description                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| PORT                    | The port on which the bridge is started.                                                                           |
| BRIDGE_AUTH_USERNAME    | The username to access the bridge's API.                                                                           |
| BRIDGE_AUTH_PASSWORD    | The password to access the bridge's API.                                                                           |
| CONN_MODE               | Whether to use HTTP or HTTPS for the bridge's API.                                                                 |
| SSL_CERT                | The path to the certificate file to use when using HTTPS.                                                          |
| SSL_KEY                 | The path to the private key file to use when using HTTPS.                                                          |
| OAUTH_TOKEN_URL         | The URL where the Oauth token can be retrieved from SAP Commerce.                                                  |
| BASE_URL                | The base URL of the SAP Commerce Server (the URL without any paths).                                               |
| MEDIA_CDN_URL           | The URL of the Server where the Media files (Images) reside. (SAP Commerce default: the same as the BASE_URL).     |
| OCC_PATH                | The path of the OCC V2 api, relative to the BASE_URL (SAP Commerce default: "/occ/v2/").                           |
| CMS_PATH                | The Path of the CMS webservices API, relative to the BASE_URL (SAP Commerce default: "/cmswebservices/v1/sites/"). |
| BASE_SITE_ID            | The ID of the SAP Commerce Basesite used for content and products.                                                 |
| CATALOG_ID              | The ID of the product catalog used in SAP Commerce.                                                                |
| CATALOG_VERSION         | The version of the product catalog used in SAP Commerce.                                                           |
| CONTENT_CATALOG_ID      | The ID of the content catalog used in SAP Commerce.                                                                |
| CONTENT_CATALOG_VERSION | The version of the content catalog used in SAP Commerce.                                                           |
| API_USERNAME            | The username to authenticate to SAP Commerce.                                                                      |
| API_PASSWORD            | The password to authenticate to SAP Commerce.                                                                      |
| CLIENT_ID               | The client ID used to authenticate to SAP Commerce using OAuth2.                                                   |
| CLIENT_SECRET           | The client secret used to identify to SAP Commerce using OAuth2.                                                   |
| AIR_KEY                 | The AIR (Application Interface Register) Key, as obtained from SAP (optional).                                     |

#### Configure Template Mapping
To map FirstSpirit Templates to SAP Commerce Cloud Templates this Bridge uses a simple .json file, which can be found at 'src/resources/FStoSAPTemplateMapping.json'.
To add to this map simply use the FirstSpirit template Ids as keys and the SAP Commerce Cloud template Ids as values.

### Run bridge
Before starting the bridge for the first time, you have to install its dependencies:
```
npm install
```

To start the bridge run:

```
npm start
```

### Run bridge in development mode
To start the bridge and re-start it whenever a file changed:
```
npm run start:watch
```

### View the Swagger UI interface

Open http://localhost:3000/docs in your browser to display the bridge's interactive API documentation.

### Configure FirstSpirit Module
In order to enable the Connect for Commerce FirstSpirit Module to communicate with the bridge, you have to configure it. Please refer to [the documentation](https://docs.e-spirit.com/ecom/fsconnect-com/FirstSpirit_Connect_for_Commerce_Documentation_EN.html#install_pcomp) to learn how to achive this. 

## Legal Notices
The FirstSpirit Connect for Commerce SAP Commerce Cloud bridge is a product of [Crownpeak Technology GmbH](https://www.crownpeak.com), Dortmund, Germany. The FirstSpirit Connect for Commerce SAP Commerce Cloud bridge is subject to the Apache-2.0 license.

## Disclaimer
This document is provided for information purposes only. Crownpeak may change the contents hereof without notice. This document is not warranted to be error-free, nor subject to any other warranties or conditions, whether expressed orally or implied in law, including implied warranties and conditions of merchantability or fitness for a particular purpose. Crownpeak specifically disclaims any liability with respect to this document and no contractual obligations are formed either directly or indirectly by this document. The technologies, functionality, services, and processes described herein are subject to change without notice.