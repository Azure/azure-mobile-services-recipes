Windows Azure Mobile Services Recipes
=======================

Recipes are commonly used, vertical tasks in mobile apps presented as solutions to simplify mobile app development.

This repository contains Mobile Services recipe core module 'azuremobile-recipe', and some common recipes developed by Mobile Services.

All recipes listed in this repository are published at https://npmjs.org/search?q=azuremobile and can be installed through npm.

# Getting started

## Prerequisite
Make sure node.js is installed (install at http://nodejs.org/) as well as azure-cli. To do so, run in command line:
```bash
npm install -g azure-cli
```
Note: Azure CLI needs to be installed through npm. Users with Azure CLI installed through the Windows .msi installer will need to uninstall .msi and reintall Azure CLI through npm.

## Install Recipe Core Module
All recipes require the recipe core module.
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