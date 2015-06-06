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

    return require($entryPoint);
})($modules);
