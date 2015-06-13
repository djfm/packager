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

    return require("entry.js");
})({
    "entry.js": {
        "map": {
            "./a": "a.js",
            "./other-a/require-other-a": "other-a/require-other-a.js"
        },
        "build": function (module, exports, require) {
/*__sourcemap__start__of__file__ entry.js*/module.exports = require('./a') + require('./other-a/require-other-a');
/*__sourcemap__end__of__file__ entry.js*/
}
    },
    "a.js": {
        "map": {},
        "build": function (module, exports, require) {
/*__sourcemap__start__of__file__ a.js*/module.exports = 'the one and the ';
/*__sourcemap__end__of__file__ a.js*/
}
    },
    "other-a/require-other-a.js": {
        "map": {
            "./a": "other-a/a.js"
        },
        "build": function (module, exports, require) {
/*__sourcemap__start__of__file__ other-a/require-other-a.js*/module.exports = require('./a');
/*__sourcemap__end__of__file__ other-a/require-other-a.js*/
}
    },
    "other-a/a.js": {
        "map": {},
        "build": function (module, exports, require) {
/*__sourcemap__start__of__file__ other-a/a.js*/module.exports = 'other a';
/*__sourcemap__end__of__file__ other-a/a.js*/
}
    }
});
