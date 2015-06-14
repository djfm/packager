module.exports = {
    sourceMapFile: 'package.js.map.json',
    extensions: [{
        extension: '.js'
    },
    require('../extensions/node'),
    require('../extensions/jade')
    ]
};
