var x = require('a');

if (x !== 'This is X.') {
    throw new Error('Simple browser field in package.json seems to have been ignored.');
}
