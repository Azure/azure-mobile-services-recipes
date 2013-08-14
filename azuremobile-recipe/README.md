AzureMobile-Recipe
=======================

Azure Mobile Services Recipe core module

The recipe core module extends Azure CLI (Command Line Interface) to enable globally installed recipe usage and provides function library to simplify recipe development. This module installation is REQUIRED before any recipe usage.

# Getting started

## Before Installation
Make sure node.js is installed (install at http://nodejs.org/) as well as npm modules azure-cli. To do so, run in command line:
```bash
npm install -g azure-cli
```
Note: Azure CLI needs to be installed through npm. Users with Azure CLI installed through the Windows .msi installer will need to uninstall .msi and reintall Azure CLI through npm.

## Install it
```bash
npm install -g azuremobile-recipe
```

## Executing any Azure Mobile Services recipes
To install a recipe:
```bash
npm install -g azuremobile-<recipename>
```
To execute an installed recipe with user account downloaded and imported and an existing mobile service created, cd to project directory and run in command line:
```bash
azure mobile recipe execute <servicename> <recipename>
```

## Listing globally installed recipes on user machine:
```bash
azure mobile recipe list
```

## Acquiring template files to get started with Azure Mobile Services recipe development:
```bash
azure mobile recipe create <newRecipename>
```