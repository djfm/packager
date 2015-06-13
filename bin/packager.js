#!/usr/bin/env node
var path = require('path');
var fs = require('fs');
var packager = require('../lib/packager');

var entryPoint  = process.argv[2];
var extension   = path.extname(entryPoint);
var output      = process.argv[3] || path.basename(entryPoint, extension) + '.package' + extension;

if (!entryPoint) {
    console.log("Missing entry point argument.");
    process.exit(1);
}

var mapFile = output + '.map.json';
var mapURL = path.basename(mapFile);

packager.package(entryPoint, {
    sourceMapFile: mapURL
}).then(function (package) {
    if (package.map) {
        fs.writeFileSync(mapFile, package.map);
        if (!/^\/\/# sourcemap/.exec(package.code)) {
            package.code += "\n//# sourceMappingURL=" + mapURL;
        }
    }
    fs.writeFileSync(output, package.code);
}).fail(function (err) {
    console.log(err.toString());
});
