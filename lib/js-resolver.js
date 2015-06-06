var fs      = require('fs'),
    q       = require('q'),
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
function resolveRequiredFilePath (rf, config) {
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
            candidates.push(path.join(dirs[i], 'node_modules', rf.raw));
        }
    }

    var candidatesWithExtensions = [],
        extensions = getExtensions(config)
    ;

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

    return candidatesWithExtensions.reduce(function (soFar, dir) {
        return soFar.then(soFar).fail(function () {
            return doResolve(rf, dir);
        });
    }, q.reject(new Error('Could not resolve required file.')));
}

function doResolve (rf, path) {
    var d = q.defer();

    fs.exists(path, function (yes) {
        if (yes) {
            rf.path = path;
            d.resolve(rf);
        } else {
            d.reject(new Error('Could not resolve required file.'));
        }
    });

    return d.promise;
}

exports.resolveRequiredFilePath = resolveRequiredFilePath;
