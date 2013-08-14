/*
 *
 *	This is recipe's index script. It includes some common pre-filled function snippets
 *	for table creations, script uploads, and client file downloads.
 *
 *
 */

/*
   Azure Mobile Services - Recipe - $

    Copyright YYYY AuthorName

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

*/

// function that gets called when users execute this recipe from their project directory
exports.execute = function (myMobileservice, recipe, callback) {

    var recipeName = '$', // new recipe
        resolvedTableName, // for resolving table naming conflict
        resolvedJobName; // for resolving job naming conflict

    // More function reference: https://github.com/ysxu/AzureMobile-Recipe/blob/master/recipeUtils.js
    // modules and libraries provided (recipes can also depend on modules specified in package.json)
    var scripty = recipe.scripty; // reference: https://github.com/glennblock/azure-scripty
    var async = recipe.async; // reference: https://github.com/caolan/async
    var fs = recipe.fs; // reference: http://nodejs.org/api/fs.html
    var path = recipe.path; // reference: http://nodejs.org/api/path.html
    var exec = recipe.exec; // reference: http://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback

    // logging
    var log = recipe.cli.output; // log.info, log.warn, log.error

    // regex constant for user input
    var REGEXP = recipe.REGEXP; // for azure related input: /^[a-zA-Z][0-9a-zA-Z-]*[0-9a-zA-Z]$/
    var REGYN = recipe.REGYN; // for yes/no: /^(y|n|yes|no)$/i
    
    // async makes sure blocks in function (callback) run asynchronously
    async.series([

        function (callback) {

            // prompt users to enter extra information
            recipe.ask("Give me extra info", REGEXP, "customized error message", function (name) {
                log.info("This is the user input: " + name);
                callback();
            });
        },

        function (callback) {

            // creates table 'tableName' and resolves naming conflicts 
            recipe.createTable(myMobileservice, "tableName", function (err, results) {
                if (err) return callback(err);
                resolvedTableName = results;
                callback();
            });
        },

        function (callback) {

            // creates job 'jobName' and resolves naming conflicts 
            recipe.createJob(myMobileservice, "jobName", function (err, results) {
                if (err) return callback(err);
                resolvedJobName = results;
                callback();
            });
        },

        function (callback) {

            // logging
            log.info("Copying & Uploading table scripts...");

            // script info
            var tableScript = [{
                dir: 'dir',
                file: 'file',
                newDir: 'newDir',
                newFile: 'newFile',
                original: ['placeholder1','placeholder2'],
                replacement: ['customizedValue1', 'customizedValue2']
            }];

            // copy all files in above object following the specified info from the given globally installed recipe directory to user working directory 
            // and perform placeholder customizations to prepare scripts for upload and usage
            recipe.copyFiles(recipeName, tableScript, function (err) {
                if (err) return callback(err);
                callback();
            });
        },

        function (callback) {

            // path to table script file
            var myScriptPath = 'server_files/table/resolvedTableName.insert.js';

            // progress log
            var progress = recipe.cli.progress('Uploading table script \'' + myInsertscript + '\'');

            // upload script with CLI commands through azure-scripty
            // equivalent to 'azure mobile script upload <service> <script> -f <scriptPath>'
            scripty.invoke('mobile script upload ' + myMobileservice + ' table/resolvedTableName.insert.js -f ' + myScriptPath, function (err, results) {
                if (err) return callback(err);
                progress.end();
                callback();
            });

        }
    ],

    function (err, results) {
        // if error occurs at any previous step, callback(error) gets returned and thrown here
        if (err) throw err;
        callback();
    });

}