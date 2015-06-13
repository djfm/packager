var tpl = require('./tpl')();

if (tpl !== '<p>hello world</p>') {
    throw new Error('Jade template wasn\'t compiled. Got: ' + tpl);
}
