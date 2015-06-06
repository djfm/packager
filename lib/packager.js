var fs          = require('fs');
var path        = require('path');
var q           = require('q');
var _           = require('underscore');
var jsp         = require('esprima');
var resolver    = require('./js-resolver');
var Mangler     = require('./mangler');

function traverse (node, visitor) {
    if (typeof node === 'object' && node !== null) {
        visitor(node);
        for (var key in node) {
            if (Object.prototype.hasOwnProperty.call(node, key)) {
                traverse(node[key], visitor);
            }
        }
    }
}

function listRequiredFilesInSourceCode (sourceCode) {
    var requiredFiles = [];
    var ast = jsp.parse(sourceCode);

    traverse(ast, function (node) {
        if (node.type === 'CallExpression' &&
            node.callee.type === 'Identifier' &&
            node.callee.name === 'require') {
            if (node.arguments.length > 0 && node.arguments[0].type === 'Literal') {
                var raw = node.arguments[0].value;
                requiredFiles.push({
                    raw: raw
                });
            }
        }
    });

    return requiredFiles;
}

function doListRequiredFiles (mainPath, alreadySeenPaths) {
    var d = q.defer();

    if (Object.prototype.hasOwnProperty.call(alreadySeenPaths, mainPath)) {
        d.resolve([]);
    } else {
        fs.readFile(mainPath, function (err, data) {
            if (err) {
                d.reject(new Error(err));
            } else {
                var jsCode = data.toString();

                alreadySeenPaths[mainPath] = jsCode;

                var children = listRequiredFilesInSourceCode(jsCode).map(function (rf) {
                    rf.requiredFrom = mainPath;
                    return resolver.resolveRequiredFilePath(rf).then(function (rf) {
                        return doListRequiredFiles(rf.path, alreadySeenPaths).then(function (files) {
                            return [rf].concat(files);
                        });
                    });
                });

                q.all(children).then(function (rfs) {
                    var files = rfs.reduce(function (requiredFiles, rfarray) {
                        return requiredFiles.concat(rfarray);
                    }, []);

                    d.resolve(files);
                }).fail(d.reject);
            }
        });
    }

    return d.promise;
}

/**
 * Lists the files required by the file at mainPath.
 * Returns a promise for an array of required files.
 */
function listRequiredFiles (mainPath) {
    var sources = {};
    return doListRequiredFiles(mainPath, sources).then(function (files) {
        return {
            files: files,
            sources: sources
        };
    });
}

function package (entryPoint) {
    return listRequiredFiles(entryPoint).then(function (data) {
        var modules = {};

        var mangler = new Mangler();

        _.each(data.files, function (file) {
            mangler
                .add(file.requiredFrom)
                .add(file.path)
            ;
        });

        _.each(data.files, function (file) {
            file.requiredFrom = mangler.mangle(file.requiredFrom);
            file.raw = mangler.mangle(file.raw);
            file.path = mangler.mangle(file.path);
        });

        _.each(data.sources, function (code, path) {
            path = mangler.mangle(path);
            modules[path] = {
                map: {

                },
                build: 'build ' + path
            };
        });

        _.each(data.files, function (file) {
            modules[file.requiredFrom].map[file.raw] = file.path;
        });

        var modulesCode = JSON.stringify(modules, null, 4);

        _.each(data.sources, function (code, path) {
            path = mangler.mangle(path);
            var wrapper = 'function (module, exports, require) {\n' + code + '\n}';
            modulesCode = modulesCode.replace('"build ' + path + '"', wrapper);
        });

        var template = fs.readFileSync(path.join(__dirname, 'package.template.js')).toString();

        var code = template
                    .replace('$modules', modulesCode)
                    .replace('$entryPoint', JSON.stringify(mangler.mangle(entryPoint)))
        ;

        return {
            code: code
        };
    });
}

exports.listRequiredFiles = listRequiredFiles;
exports.package = package;
