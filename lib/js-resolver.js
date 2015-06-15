var fs      = require('fs'),
    q       = require('q'),
    _       = require('underscore'),
    path    = require('path')
;

// maybe we're on an older node.js
path.isAbsolute = path.isAbsolute || require('path-is-absolute');

function parentDirectories (filePath) {
    var dirs = [], current = filePath, parent;
    while ((parent = path.dirname(current)) !== current) {
        dirs.push(parent);
        current = parent;
    }
    return dirs;
}

/**
 * Lists the extensions that we're allowed to load,
 * in order of priority.
 */
function getExtensions (config) {
    var extensions = [];

    if (!config || !config.extensions) {
        extensions.push('.js');
    } else {
        for (var i = 0, len = config.extensions.length; i < len; ++i) {
            extensions.push(
                config.extensions[i].extension
            );
        }
    }

    return extensions;
}

/**
 * Populates a required file with its path, according
 * to the native node.js require() conventions.
 * Returns a promise for the passed-in rf with
 * its 'path' property filled in.
 */
function resolveRequiredFilePath (rf, config, history) {

    /**
     * For now we delegate the packaging of builtins to browserify
     */
    var builtins = require('browserify/lib/builtins');
    if (_.has(builtins, rf.raw)) {
        rf.path = builtins[rf.raw];
        return q(rf);
    }


    function getCandidateLocations () {
        var candidates = [];
        if (path.isAbsolute(rf.raw)) {
            // just look inside the provided absolute path
            candidates.push(rf.raw);
        } else if (rf.raw[0] === '.' && rf.raw[1] === '/') {
            // join relative path and look there
            candidates.push(path.join(
                path.dirname(rf.requiredFrom),
                rf.raw
            ));
        } else {
            // looks like a node_module! Climb the directory
            // tree until we find something interesting
            var dirs = parentDirectories(rf.requiredFrom);
            for (var i = 0, len = dirs.length; i < len; ++i) {
                var base = path.join(dirs[i], 'node_modules', rf.raw);
                candidates.push(base);
            }
        }

        return q.all(_.map(candidates, function addFolderAsModuleLocations (candidate) {
            var d = q.defer();

            var sublist = [];

            fs.lstat(candidate, function (err, stats) {
                if (!err && stats.isDirectory()) {

                    sublist.push(path.join(candidate, 'index'));

                    var packageJsonPath = path.join(candidate, 'package.json');
                    fs.exists(packageJsonPath, function (packageJsonExists) {
                        if (packageJsonExists) {
                            fs.readFile(packageJsonPath, function (err, data) {
                                if (err) {
                                    d.reject(new Error(err));
                                } else {
                                    var json = JSON.parse(data.toString());
                                    if (json.browser) {
                                        if (typeof json.browser !== "string") {
                                            throw new Error(
                                                "Only 'string' package.json 'browser' fields are supported at the moment (package.json is at: " + packageJsonPath + ")."
                                            );
                                        } else {
                                            sublist.unshift(path.join(candidate, json.browser));
                                        }
                                    }
                                    if (json.main) {
                                        sublist.unshift(path.join(candidate, json.main));
                                    }
                                    d.resolve(sublist);
                                }
                            });
                        } else {
                            d.resolve(sublist);
                        }
                    });

                } else {
                    sublist.push(candidate);
                    d.resolve(sublist);
                }
            });

            return d.promise;
        })).then(function (sublists) {
            return Array.prototype.concat.apply([], sublists);
        });
    }

    function addExtensions (candidates) {
        var candidatesWithExtensions = [];
        var extensions = getExtensions(config);

        for (var c = 0, cLen = candidates.length; c < cLen; ++c) {
            for (var e = 0, eLen = extensions.length; e < eLen; ++e) {
                if (candidates[c].substr(-extensions[e].length) !== extensions[e]) {
                    candidatesWithExtensions.push(
                        candidates[c] + extensions[e]
                    );
                } else {
                    candidatesWithExtensions.push(candidates[c]);
                }
            }
        }

        return candidatesWithExtensions;
    }

    function checkLocation (path) {
        var d = q.defer();

        fs.exists(path, function (yes) {
            if (yes) {
                d.resolve(path);
            } else {
                d.resolve(null);
            }
        });

        return d.promise;
    }

    return getCandidateLocations().then(addExtensions).then(function (candidates) {
        return candidates.reduce(function (soFar, path) {
            return soFar.then(function (pathOrNull) {
                if (null === pathOrNull) {
                    return checkLocation(path);
                } else {
                    return pathOrNull;
                }
            });
        }, q(null));
    }).then(function (pathOrNull) {
        if (null === pathOrNull) {
            var chain = _.map(history, function (h) {
                return '"' + h.requiredFrom + '" => "' + h.raw + '"';
            }).join(', ');
            throw new Error('Could not resolve required file "' + rf.raw + '". Require chain: ' + chain);
        } else {
            rf.path = pathOrNull;
            return rf;
        }
    });
}

exports.resolveRequiredFilePath = resolveRequiredFilePath;
