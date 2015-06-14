module.exports = {
    extension: '.json',
    compile: function compileDotJson (sourceCode) {
        return 'module.exports = ' + sourceCode + ';';
    }
};
