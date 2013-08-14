/*
   Azure Mobile Services - Recipe - Leaderboard

    Copyright 2013 Mimi Xu

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
exports.execute = function (myMobileservice, recipe, callback) {
    var recipename = 'leaderboard';

    // variable customizations
    var myLeaderboard = "Leaderboard",
        myResult = "Result",
        myNamespace = "";

    // file customizations
    var original = [],
        replacement = [],
        files;

    // logging
    var log = recipe.cli.output,
        progress;

    recipe.async.series([
            function (callback) {
                // create leaderboard table
                recipe.createTable(myMobileservice, "Leaderboard", function (err, results) {
                    if (err) return callback(err);
                    myLeaderboard = results;
                    callback();
                });
            },
            function (callback) {
                // create result table
                recipe.createTable(myMobileservice, "Result", function (err, results) {
                    if (err) return callback(err);
                    myResult = results;
                    callback();
                });
            },
            function (callback) {
                // retreive result table script
                log.info('');
                progress = recipe.cli.progress('Copying scripts\n');
                original = ['\\$leaderboard', '\\$result'];
                replacement = [myLeaderboard, myResult];
                var tableFile = [{
                    dir: 'server_files/table',
                    file: 'Result.insert.js',
                    newFile: myResult + '.insert.js',
                    original: original,
                    replacement: replacement
                }];
                recipe.copyFiles(recipename, tableFile, function (err) {
                    if (err) return callback(err);
                    progress.end();
                    callback();
                });
            },
            function (callback) {
                // upload result table script
                var tableInsertscript = 'table/' + myResult + '.insert.js';
                var myInsertscript = 'server_files/' + tableInsertscript;

                progress = recipe.cli.progress('Uploading table script \'' + myInsertscript + '\'');
                recipe.scripty.invoke('mobile script upload ' + myMobileservice + ' ' + tableInsertscript + ' -f ' + myInsertscript, function (err, results) {
                    if (err) return callback(err);
                    else {
                        progress.end();
                        callback();
                    }
                });
            },
            function (callback) {
                // prompt for existing app namespace]
                log.info('');
                recipe.ask("Existing app namespace: ", recipe.REGEXP, "Namespace format not recognized", function (name) {
                    myNamespace = name;
                    callback(null, name);
                });
            },
            function (callback) {
                // find all client files
                recipe.readPath(recipe.path.join(__dirname, './client_files'), __dirname, function (err, results) {
                    if (err) return callback(err);
                    files = results;
                    callback();
                });
            },
            function (callback) {
                original = ['\\$leaderboard', '\\$result', '\\$namespace'];
                replacement = [myLeaderboard, myResult, myNamespace];
                // format client files
                recipe.async.forEachSeries(
                    files,
                    function (file, done) {
                        file.original = original;
                        file.replacement = replacement;
                        done();
                    },
                    function (err) {
                        if (err) return callback(err);
                        callback();
                    });
            },
            function (callback) {
                // copy client files to user environment
                recipe.copyFiles(recipename, files, function (err) {
                    if (err) return callback(err);
                    callback();
                });
            }
        ],
        function (err, results) {
            if (err) throw err;
            callback();
        });
}