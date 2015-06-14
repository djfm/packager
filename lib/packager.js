var fs          = require('fs');
var path        = require('path');
var jsp         = require('esprima');
var q           = require('q');
var UglifyJS    = require('uglify-js');
var _           = require('underscore');
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

function doListRequiredFiles (mainPath, alreadySeenPaths, options, history) {
    var d = q.defer();

    if (Object.prototype.hasOwnProperty.call(alreadySeenPaths, mainPath)) {
        d.resolve([]);
    } else {
        fs.readFile(mainPath, function (err, data) {
            if (err) {
                d.reject(new Error(err));
            } else {
                var code = data.toString();

                if (options && options.extensions) {
                    var extension = _.find(options.extensions, function (ext) {
                        return ext.extension === path.extname(mainPath);
                    });

                    if (extension && extension.compile) {
                        code = extension.compile(code);
                    }
                }

                var jsCode = code;

                alreadySeenPaths[mainPath] = jsCode;

                var children = listRequiredFilesInSourceCode(jsCode).map(function (rf) {
                    rf.requiredFrom = mainPath;
                    var newHistory = _.clone(history);
                    newHistory.push(rf);
                    return resolver.resolveRequiredFilePath(rf, options, newHistory).then(function (rf) {
                        return doListRequiredFiles(rf.path, alreadySeenPaths, options, newHistory).then(function (files) {
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
function listRequiredFiles (mainPath, options) {
    var sources = {};
    var history = [];
    return doListRequiredFiles(mainPath, sources, options, history).then(function (files) {
        return {
            files: files,
            sources: sources
        };
    });
}

function package (entryPoint, options) {

    options = _.defaults(options || {}, require('./default-options'));

    return listRequiredFiles(entryPoint, options).then(function (data) {
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
            var wrapper = 'function (module, exports, require) {\n/*__sourcemap__start__of__file__ ' + path + '*/' + code + '/*__sourcemap__end__of__file__ ' + path + '*/\n}';
            modulesCode = modulesCode.replace('"build ' + path + '"', wrapper);
        });

        var template = fs.readFileSync(path.join(__dirname, 'package.template.js')).toString();

        var code = template
                    .replace('$modules', modulesCode)
                    .replace('$entryPoint', JSON.stringify(mangler.mangle(entryPoint)))
        ;

        var map = JSON.parse(require('./source-mapper').buildSourceMap(code).toString());

        var minified = UglifyJS.minify(code, {
            inSourceMap: map,
            outSourceMap: options.sourceMapFile,
            fromString: true,
            sourceMapIncludeSources: true
        });

        return minified;
    });
}

exports.listRequiredFiles = listRequiredFiles;
exports.package = package;
exports.getDefaultOptions = function getDefaultOptions () {
    return require('./default-options');
};
