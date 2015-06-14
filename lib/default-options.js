module.exports = {
    sourceMapFile: 'package.js.map.json',
    extensions: [
        require('../extensions/js'),
        require('../extensions/json'),
        require('../extensions/jade'),
        require('../extensions/node')
    ]
};
