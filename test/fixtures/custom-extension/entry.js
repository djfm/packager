var got = require('./test');

if (got() !== 42) {
    throw new Error('Custom file was not correctly loaded.');
}
