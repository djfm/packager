#!/usr/bin/env node
var path = require('path');
var fs = require('fs');
var packager = require('../lib/packager');

var entryPoint = process.argv[2];
var extension = path.extname(entryPoint);
var output = process.argv[3] || path.basename(entryPoint, extension) + '.package' + extension;

if (!entryPoint) {
    console.log("Missing entry point argument.");
    process.exit(1);
}

packager.package(entryPoint).then(function (package) {
    fs.writeFileSync(output, package.code);
}).fail(function (err) {
    console.log(err.toString());
});
