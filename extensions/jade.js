var jade = require('jade');

module.exports = {
    extension: '.jade',
    compile: function compileJadeTemplate (sourceCode) {
        var tpl = jade.compileClient(sourceCode);
        return 'module.exports = ' + tpl;
    }
};
