function shouldReturn42 () {
    return require('./dep');
}

if (shouldReturn42() !== 42) {
    throw new Error('Expected 42.');
}
