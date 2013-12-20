/*
   Azure Mobile Services - Recipe Core Module

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
var recipe = require('./recipeUtils.js');

module.exports.init = function (cli) {
    var mobile = cli.category('mobile');
    var log = cli.output;
    var mobileRecipe = mobile.category('recipe');

    mobileRecipe.description('Commands to use Mobile Services Recipes');

    // help export cli
    recipe.setCli(cli);


    /*
     * list all globally installed recipes
     */

    mobileRecipe.command('list')
        .description('List the installed recipes')
        .execute(function (recipename, options, callback) {

            var fileList = recipe.fs.readdirSync(recipe.path.join(__dirname, '..')),
                recipeList = [];

            // find all recipes
            for (var i in fileList) {
                var match = 'azuremobile-'.length;
                if ((fileList[i].substring(0, match).toLowerCase() === "azuremobile-") && (fileList[i].toLowerCase() !== "azuremobile-recipe")) {
                    recipeList.push(fileList[i].slice(match));
                }
            }

            // list recipes
            log.info("");
            if (recipeList.length > 0) {
                log.table(recipeList, function (row, s) {
                    row.cell('Installed Recipes', s);
                });
            } else {
                log.info("No installed recipes found.");
            }
            log.info("");
            callback();
        });


    /*
     * copy to user directory recipe templates
     */

    mobileRecipe.command('create [recipename]')
        .usage('[recipename] [options]')
        .description('Retrieve template files for creating a new recipe')
        .execute(function (recipename, options, callback) {

            var azureRecipe = '',
                original,
                replacement,
                files;

            recipe.async.series([
                    function (callback) {
                        // error check: recipe name
                        recipe.validate("Recipe name: ", recipename, recipe.REGEXP, "Recipe name format not recognized", function (name) {
                            recipename = name.toLowerCase();
                            callback();
                        });
                    },
                    function (callback) {
                        azureRecipe = 'azuremobile-' + recipename;
                        // check if recipe exists in npm directory
                        var progress = cli.interaction.progress('Checking recipe name availability');
                        recipe.exec('npm owner ls ' + azureRecipe, function (error, stdout, stderr) {
                            if (!error) {
                                throw new Error('Recipe name ' + azureRecipe + ' already exists in npm directory');
                            }
                            else {
                                recipe.fs.unlink(recipe.path.join(process.cwd(),'npm-debug.log'), function (err) {
                                    if (err) 
                                        log.warn('Fail to delete npm-debug.log');
                                });
                            }
                            progress.end();
                            callback();
                        });
                    },
                    function (callback) {
                        // retrieve and copy template files
                        original = ['\\$'];
                        replacement = [recipename];
                        // find all new recipe files
                        recipe.readPath(recipe.path.join(__dirname, 'newRecipe'), __dirname, function (err, results) {
                            if (err) return callback(err);
                            files = results;
                            callback();
                        });
                    },
                    function (callback) {
                        // copy all client files and create directories
                        recipe.async.forEachSeries(
                            files,
                            function (file, done) {
                                recipe.copyRecipeFile(file.dir.replace(__dirname, ''), file.file, azureRecipe, '', original, replacement,
                                    function (err) {
                                        if (err) return callback(err);
                                        done();
                                    });
                            },
                            function (err) {
                                if (err) return callback(err);
                                log.info('');
                                log.table(files, function (row, s) {
                                    row.cell('Files copied', recipe.path.join(azureRecipe, s.file));
                                });
                                callback();
                            });
                    },
                    function (callback) {
                        // create useful directories
                        files = ['client_files', recipe.path.join('server_files', 'shared'), recipe.path.join('server_files', 'API'), recipe.path.join('server_files', 'table')];
                        recipe.async.forEachSeries(
                            files,
                            function (file, done) {
                                var pathName = recipe.path.join(process.cwd(), azureRecipe, file);
                                recipe.makeDir(pathName, function (err) {
                                    if (err) return callback(err);
                                    done();
                                });
                            },
                            function (err) {
                                if (err) return callback(err);
                                log.info('');
                                log.table(files, function (row, s) {
                                    row.cell('Directories created', recipe.path.join(azureRecipe, s));
                                });
                                log.info('');
                                callback();
                            });
                    }
                ],
                function (err, results) {
                    if (err) throw err;
                    callback();
                });
        });


    /*
     * use recipes
     */

    mobileRecipe.command('execute [servicename] [recipename]')
        .usage('[servicename] [recipename] [options]')
        .description('Execute a mobile service recipe')
        .execute(function (servicename, recipename, options, callback) {

            recipe.async.series([
                    function (callback) {
                        // error check: service name
                        recipe.validate("Mobile Service name: ", servicename, recipe.REGEXP, "Service name format not recognized", function (name) {
                            servicename = name;
                            callback();
                        });
                    },
                    function (callback) {
                        // error check: service exists
                        log.info('');
                        var progress = cli.interaction.progress('Validating mobile service: \'' + servicename + '\'');
                        recipe.scripty.invoke('mobile show ' + servicename, function (err, results) {
                            progress.end();
                            if (err) return callback(err);
                            callback();
                        });
                    },
                    function (callback) {
                        // error check: recipe name
                        recipe.validate("Recipe name: ", recipename, recipe.REGEXP, "Recipe name format not recognized", function (name) {
                            recipename = name.toLowerCase();
                            callback();
                        });
                    },
                    function (callback) {
                        // call recipe
                        var recipePath = recipe.path.join(__dirname, '..', 'azuremobile-' + recipename, 'index.js');
                        require(recipePath).execute(servicename, recipe, function (err) {
                            if (err) return callback(err);
                            callback();
                        });
                    }
                ],
                function (err, results) {
                    if (err) throw err;
                    callback();
                });
        });
};