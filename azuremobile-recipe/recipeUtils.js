/*
 * RECIPE FUNCTION LIBRARY
 *
 *
 */

var _ = require('underscore');
var util = require('util');

exports.scripty = require('azure-scripty');
exports.async = require('async');
exports.fs = require('fs');
exports.path = require('path');
exports.exec = require('child_process').exec;

// regex constant for user input
exports.REGEXP = /^[a-zA-Z][0-9a-zA-Z-]*[0-9a-zA-Z]$/;
exports.REGYN = /^(y|n|yes|no)$/i;

// cli functions & logging
exports.cli;
var log;
exports.setCli = function (cli) {
    exports.cli = cli;
    log = exports.cli.output;
}

/**
 * Prompt users to enter information, requires input string to match a given regex
 * @param {string} msg String to display as the prompt
 * @param {regex} format regular expression to match input value to to (optional)
 * @param {string} errmsg displayed when input validation failed
 * @param {function} callback function
 */
exports.ask = function (msg, format, errmsg, callback) {
    // Format message for cli.prompt, we are forcing single entry ': '
    var colonLocation = msg.indexOf(':', msg.length - 2); 
    if(colonLocation === -1) {
        msg += ': ';
    } else if(colonLocation !== msg.length - 1) {
        msg += ' ';
    }

    // Adjust for optional format param
    if (arguments.length === 3 && _.isFunction(errmsg)) {
        callback = errmsg;
        errmsg = format;
        format = null;
    }

    // Prompt for input and validate result
    exports.cli.prompt(msg, function (input) {
        if (format !== null) {
            if (format.test(input)) {
                callback(input);
            } else {
                log.warn(errmsg);
                exports.ask(msg, format, errmsg, callback);
            }
        } else {
            callback(input);
        }
    });
}

// Check user input/promt if error or undefined
// validate(string, variable/string, regex, string, callback)
// validate(string, varaible/string, string, callback)
exports.validate = function (msg, current, format, errmsg, callback) {
    if ((arguments.length === 4) && (Object.prototype.toString.call(format) === "[object Function]")) {
        callback = errmsg;
        errmsg = format;
        format = exports.REGEXP;
    }

    if (current && format.test(current))
        callback(current);
    else {
        if (current)
            log.warn(errmsg);
        else
            log.warn('Current variable value is null');
        exports.ask(msg, format, errmsg, callback);
    }
}

// Create table and performs error handling on existing table names
// createTable(string, string, object: {tableInsert: '', tableUpdate: '', tableDelete: '', tableRead: ''}, callback)
exports.createTable = function (myMobileservice, tablename, permission, callback) {
    var usertablename = tablename,
        progress;

    if ((arguments.length === 3) && (Object.prototype.toString.call(permission) === "[object Function]")) {
        callback = permission;
        permission = {
            tableInsert: 'application',
            tableUpdate: 'application',
            tableDelete: 'application',
            tableRead: 'application'
        };
    }

    permission.tableInsert = permission.tableInsert || 'application';
    permission.tableUpdate = permission.tableUpdate || 'application';
    permission.tableDelete = permission.tableDelete || 'application';
    permission.tableRead = permission.tableRead || 'application';

    permission = '--permissions insert=' + permission.tableInsert + ',update=' + permission.tableUpdate + ',delete=' + permission.tableDelete + ',read=' + permission.tableRead;

    log.info('');
    progress = exports.cli.interaction.progress('Checking availability for table name \'' + tablename + '\'');
    exports.scripty.invoke('mobile table show ' + myMobileservice + ' ' + tablename, function (err, results) {
        // table exists
        progress.end();
        if (results.columns.length !== 0) {
            exports.ask("Table '" + tablename + "' exists. Use existing?(Y/N): ", exports.REGYN, "Input format not recognized", function (choice) {
                if (choice.toLowerCase() === 'n' || choice.toLowerCase() === 'no') {
                    exports.ask("New " + tablename + " table name: ", exports.REGEXP, "Table name format not recognized", function (name) {
                        usertablename = name;
                        progress = exports.cli.interaction.progress('Creating new table \'' + usertablename + '\'');
                        // create choice table
                        exports.scripty.invoke('mobile table create ' + myMobileservice + ' ' + usertablename + ' ' + permission, function (err, results) {
                            if (err) throw err;
                            else {
                                progress.end();
                                callback(err, usertablename);
                            }
                        });
                    });
                } else if (choice.toLowerCase() === 'y' || choice.toLowerCase() === 'yes') {
                    log.info("Existing table '" + tablename + "' will be used for this module.");
                    progress = exports.cli.interaction.progress('Updating table permissions');
                    exports.scripty.invoke('mobile table update ' + myMobileservice + ' ' + usertablename + ' ' + permission, function (err, results) {
                        if (err) throw err;
                        progress.end();
                        callback(err, usertablename);
                    })
                } else throw new Error('Invalid input');
            });
        } else {
            progress = exports.cli.interaction.progress('Creating new table \'' + usertablename + '\'');
            exports.scripty.invoke('mobile table create ' + myMobileservice + ' ' + usertablename + ' ' + permission, function (err, results) {
                if (err) throw err;
                else {
                    progress.end();
                    callback(err, usertablename);
                }
            });
        }
    });
}

// create a scheduled job with customization and perform error handling on existing job names
// createJob(string, string, object: {interval: '', intervalUnit: '', startTime: '', status: ''}, callback)
exports.createJob = function (myMobileservice, jobName, setting, callback) {
    var userJob = jobName,
        progress,
        timeNow = new Date(),
        jobExists = false;
    // format time
    timeNow = timeNow.toISOString();

    if ((arguments.length === 3) && (Object.prototype.toString.call(setting) === "[object Function]")) {
        callback = setting;
        setting = {
            interval: 15,
            intervalUnit: 'minute',
            status: 'disabled'
        };
    }
    // default setting
    setting.interval = setting.interval || 15;
    setting.intervalUnit = setting.intervalUnit || 'minute';
    setting.status = setting.status || 'disabled';

    // settings
    var createSetting = '--interval ' + setting.interval + ' --intervalUnit ' + setting.intervalUnit;
    if (setting.startTime)
        createSetting = createSetting + ' --startTime ' + setting.startTime;
    var updateSetting =  createSetting + ' --status ' + setting.status;

    log.info('');
    progress = exports.cli.interaction.progress('Checking availability for job name \'' + jobName + '\'');
    exports.scripty.invoke('mobile job list ' + myMobileservice, function (err, results) {
        for (var i in results) {
            if (results[i].name === jobName) {
                jobExists = true;
            }
        }
        progress.end();
        // naming conflict
        if (jobExists) {
            exports.ask("Job '" + jobName + "' exists. Use existing?(Y/N): ", exports.REGYN, "Input format not recognized", function (choice) {
                if (choice.toLowerCase() === 'n' || choice.toLowerCase() === 'no') {
                    exports.ask("New " + jobName + " job name: ", exports.REGEXP, "Job name format not recognized", function (name) {
                        userJob = name;
                        progress = exports.cli.interaction.progress('Creating new job \'' + userJob + '\'');
                        // create job
                        exports.scripty.invoke('mobile job create ' + myMobileservice + ' ' + userJob + ' ' + createSetting, function (err, results) {
                            progress.end();
                            if (err) throw err;
                            else {
                                // update status
                                if (setting.status === 'enabled') {
                                    progress = exports.cli.interaction.progress('Enabling job \'' + userJob + '\'');
                                    exports.scripty.invoke('mobile job update ' + myMobileservice + ' ' + userJob + ' --status enabled', function (err) {
                                        progress.end();
                                        if (err) throw err;
                                        else callback(err, userJob);
                                    });
                                } else callback(err, userJob);
                            }
                        });
                    });
                } else if (choice.toLowerCase() === 'y' || choice.toLowerCase() === 'yes') {
                    log.info("Existing job '" + userJob + "' will be used for this module.");
                    progress = exports.cli.interaction.progress('Updating job settings');
                    exports.scripty.invoke('mobile job update ' + myMobileservice + ' ' + userJob + ' ' + updateSetting, function (err, results) {
                        if (err) throw err;
                        progress.end();
                        callback(err, userJob);
                    });
                } else throw new Error('Invalid input');
            });
        } else {
            progress = exports.cli.interaction.progress('Creating new job \'' + userJob + '\'');
            exports.scripty.invoke('mobile job create ' + myMobileservice + ' ' + userJob + ' ' + createSetting, function (err, results) {
                progress.end();
                if (err) throw err;
                else {
                    // update status
                    if (setting.status === 'enabled') {
                        progress = exports.cli.interaction.progress('Enabling job \'' + userJob + '\'');
                        exports.scripty.invoke('mobile job update ' + myMobileservice + ' ' + userJob + ' --status enabled', function (err) {
                            progress.end();
                            if (err) throw err;
                            else callback(err, userJob);
                        });
                    } else callback(err, userJob);
                }
            });
        }
    });
}

/**
 * Utility to help create a custom API for a given mobile service
 * @param {string} [myMobileservice] name of mobile service to add the api to
 * @param {string} [apiName] Name of the API to create
 * @param {object} [settings] Array of settings in form of { host: value }
 * @param {function} [callback] Callback function
 */
exports.createCustomAPI = function (myMobileservice, apiName, settings, callback) {
    var finalApiName = apiName,
        progress,
        needApiName = true;

    if (arguments.length === 3 && _.isFunction(settings)) {
        callback = settings;
        settings = { permissions: '*=application' };
    }

    settings['permissions'] = settings['permissions'] || '*=application';

    exports.async.waterfall([
        // Determine if the API exists
        function (callback) {
            progress = exports.cli.interaction.progress(util.format('Checking availability for API: \'%s\'', apiName));
            exports.scripty.invoke('mobile api list ' + myMobileservice, function (err, results) {
                progress.end();
                callback(err, _.some(results, function(api) { return api.name === apiName }));
            });
        },
        function (renameAPI, callback) {
            if(!renameAPI) {
                callback(null, true);
                return;
            }

            exports.cli.confirm(util.format('API %s already exists, do you want to overwrite it? [y/n]: ', apiName), function (decision) {
                if(!decision) {
                    exports.ask('Enter new API name: ', exports.REGEXP, 'Invalid API name', function (name) {
                        finalApiName = name;
                        callback(null, true);
                    });
                } else {
                    callback(null, false);
                }
            });
        },
        // Create/update API and its permissions
        function (newApi, callback) {
            progress = exports.cli.interaction.progress(newApi ? 'Creating API' : 'Updating API');

            var command = util.format('mobile api %s %s %s --permissions %s', 
                            newApi ? 'create' : 'update',
                            myMobileservice, 
                            finalApiName, 
                            settings.permissions);

            exports.scripty.invoke(command, function (err, result) {
                progress.end();
                callback(err, finalApiName);
            });
        }
    ], callback);
};

// copy given file from core module to user environment & customize
// for core module usage only
exports.copyRecipeFile = function (dir, file, newDir, newFile, original, replacement, callback) {
    if (original && replacement) {
        if ((original.length != replacement.length) || (!Array.isArray(original)) || (!Array.isArray(replacement))) {
            throw new Error("Customization arguments does not satisfy the requirements.");
        }
    }

    // script location
    var script = exports.path.join(__dirname, dir, file);

    newDir = newDir || dir;
    newFile = newFile || file;

    // user location
    var curdir = process.cwd();
    var filedir = exports.path.join(curdir, newDir);
    var myScript = exports.path.join(filedir, newFile);

    exports.async.series([
            function (callback) {
                // create client directory for file
                exports.makeDir(filedir, function (err) {
                    if (err) return callback(err);
                    callback();
                });
            },
            function (callback) {
                if (original && replacement) {
                    // read in module file
                    exports.fs.readFile(script, 'utf8', function (err, data) {
                        if (err) {
                            exports.fs.readFile(script, function (err, data) {
                                if (err) return callback(err);
                                exports.fs.writeFile(myScript, data, function (err) {
                                    if (err) return callback(err);
                                    callback();
                                });
                            });
                        }
                        // update scripts with customizable information
                        var result = data;
                        for (var i = 0; i < replacement.length; i++) {
                            var pattern = new RegExp(original[i], 'g');
                            result = result.replace(pattern, replacement[i]);
                        }
                        // write to user environment
                        exports.fs.writeFile(myScript, result, 'utf8', function (err) {
                            if (err) return callback(err);
                            callback();
                        });
                    });
                } else {
                    // read in module file
                    exports.fs.readFile(script, function (err, data) {
                        if (err) return callback(err);
                        exports.fs.writeFile(myScript, data, function (err) {
                            if (err) return callback(err);
                            callback();
                        });
                    });
                }
            }
        ],
        function (err, results) {
            if (err) throw err;
            callback();
        });
};

// copy given file from module to user environment & customize
var copyFile = function (recipename, dir, file, newDir, newFile, original, replacement, callback) {
    var fileDir = exports.path.join('..', recipename, dir);
    newDir = newDir || dir;
    exports.copyRecipeFile(fileDir, file, newDir, newFile, original, replacement,
        function (err) {
            if (err) callback(err);
            callback();
        });
};

// copy files from a globally installed azure mobile recipe module to user current directory
// copyFiles(string, {dir: '', file: '', newDir: '', newFile: '', original: [], replacement: []}, callback)
exports.copyFiles = function (recipename, files, callback, display) {
    // copy all client files and create directories
    exports.async.forEachSeries(
        files,
        function (file, done) {
            copyFile('azuremobile-' + recipename, file.dir.replace(__dirname, ''), file.file, file.newDir, file.newFile, file.original, file.replacement,
                function (err) {
                    if (err) callback(err);
                    done();
                });
        },
        function (err) {
            if (err) callback(err);
            if (display !== false) {
                log.info('');
                log.table(files, function (row, s) {
                    row.cell('Files copied', exports.path.join(s.dir.replace(__dirname, ''), s.newFile || s.file));
                });
                log.info('');
            }
            callback();
        });
};

// recursively create directories for given path
// makeDir(string, num, callback)
// makeDir(string, callback)
exports.makeDir = function (path, mode, callback) {

    if ((arguments.length === 2) && (Object.prototype.toString.call(mode) === "[object Function]")) {
        callback = mode;
        mode = 0777;
    }
    mode = mode || 0777;

    // format into array and exclude files
    parts = exports.path.normalize(path).split(/[\\\/]/);
    if (parts[parts.length - 1].indexOf('.') !== -1) {
        parts.pop();
    }
    if (parts[0].length === 0) {
        parts.shift();
    }

    exports.async.forEachSeries(
        parts,
        function (file, done) {
            file = parts.slice(0, parts.indexOf(file) + 1).join('/');

            exports.fs.stat(file, function (err, stat) {
                if ((!err) && (stat) && (stat.isDirectory()))
                    done();
                else {
                    exports.fs.mkdir(file, mode, function (err) {
                        if (err) {
                            if (callback) return callback(err);
                            else throw err;
                        } else done();
                    });
                }
            });
        },
        function (err) {
            if (err) {
                if (callback) return callback(err);
                else throw err;
            }
            if (callback) callback();
            else return;
        });
};

// extract directory and file separately
// splitPath(string)
exports.splitPath = function (path) {
    var pathDir = path;
    var pathFile = '';
    var parts = exports.path.normalize(path).split(/[\\\/]/);

    if (parts[parts.length - 1].indexOf('.') !== -1) {
        pathDir = parts.slice(0, parts.length - 1).join('/');
        pathFile = parts[parts.length - 1];
    }

    return {
        dir: pathDir,
        file: pathFile
    };
};

// recursively return all files in a directory with paths from origin
// readPath(string, string, callback)
exports.readPath = function (path, origin, callback) {
    var results = [];

    exports.fs.readdir(path, function (err, files) {
        if (err) return callback(err);

        exports.async.forEachSeries(
            files,
            function (file, done) {
                file = exports.path.join(path, file);

                exports.fs.stat(file, function (err, stat) {
                    if (stat && stat.isDirectory()) {
                        exports.readPath(file, origin, function (err, subresults) {
                            results = results.concat(subresults);
                            done();
                        })
                    } else {
                        results.push(exports.splitPath(file.replace(origin, '')));
                        done();
                    }
                });
            },
            function (err) {
                if (err) callback(err);
                callback(null, results);
            });
    });
};
