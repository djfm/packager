/**
 * This file is just a hand written example to show what the packaged app should look like.
 * Actual generated code might be slightly different, but this helps to reason about the system.
 */

(function (modules) {
    function require (what) {
        var loader = modules[what];
        if (!loader.module) {
            loader.module = {
                exports: {}
            };

            var localRequire = function localRequire (what) {
                return require(loader.map[what]);
            };

            loader.build(loader.module, loader.module.exports, localRequire);
        }
        return loader.module.exports;
    }

    require('/home/fram/projects/packager/test/fixtures/simple/entry.js');
})({
    '/home/fram/projects/packager/test/fixtures/simple/entry.js': {
        map: {
            './dep': '/home/fram/projects/packager/test/fixtures/simple/dep.js'
        },
        build: function (module, exports, require) {
            function shouldReturn42 () {
                return require('./dep');
            }

            console.log(shouldReturn42());
        }
    },
    '/home/fram/projects/packager/test/fixtures/simple/dep.js': {
        build: function (module, exports, require) {
            module.exports = 42;
        }
    }
});
