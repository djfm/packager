function shouldReturn42 () {
    return require('./dep');
}

module.exports = shouldReturn42();
