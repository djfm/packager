var test = require('./a') + require('./other-a/require-other-a');
module.exports = test;
console.log(test);
if (test !== 'the one and the other a') {
    throw new Error('Should equal: the one and the other a');
}
