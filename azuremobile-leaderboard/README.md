AzureMobile-Leaderboard
=======================

This recipe automates backend set up and fetches client files with Azure Mobile Services to provide Windows Store apps with a leaderboard solution. 
Platform: Windows Store Apps
Project language: C#

# Getting started

## Before Installation
Make sure node.js is installed (install at http://nodejs.org/) as well as npm modules azure-cli and azuremobile-recipe. To do so, run in command line:
```bash
npm install -g azure-cli
npm install -g azuremobile-recipe
```
Note: users with Azure CLI installed through the Windows .msi installer will not be able to access recipes at this point of time.


## Install it
```bash
npm install -g azuremobile-leaderboard
```

To set up leaderboard for a C# project with user account downloaded and imported and an existing mobile service created, cd to project directory and run in command line:
```bash
azure mobile recipe execute <servicename> leaderboard
```

The module will create a Leaderboard table and a Result table, configure their scripts, and download neccessary client-side files in the same directory.


## Use it
Include the client_files directory in project in Visual Studio.

To update tables, make sure the method is 'async' and add the below snippets into project:
```bash
projectNamespace.Functions.functions leaderboard = new projectNamespace.Functions.functions();
Globals.ResultId = await leaderboard.SendResults('playerName', 'hits', 'misses');
```

To display the leaderboard, navigate to LeaderboardPage page from an existing page:
```bash
this.rootPage.GetFrameContent().Navigate(typeof(LeaderboardPage), this.rootPage);
```


Complete testing scripts coming soon.