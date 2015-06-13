/* global describe, it */
var chai = require('chai');
var path = require('path');
var resolver = require('../lib/js-resolver');

chai.use(require('chai-as-promised'));
chai.should();

function fixturePath (relativePath) {
    return path.join(__dirname, 'fixtures', relativePath);
}

describe('JS Resolver', function () {
    it('Should find a file required by a relative path', function (done) {
        resolver.resolveRequiredFilePath({
            requiredFrom: fixturePath('nocycle/a.js'),
            raw: './b'
        })
        .get('path')
        .should.become(fixturePath('nocycle/b.js'))
        .notify(done);
    });

    it('Should find a file required by an absolute path', function (done) {
        resolver.resolveRequiredFilePath({
            requiredFrom: fixturePath('nocycle/a.js'),
            raw: fixturePath('nocycle/b')
        })
        .get('path')
        .should.become(fixturePath('nocycle/b.js'))
        .notify(done);
    });

    it('Should find a file required from node_modules', function (done) {
        resolver.resolveRequiredFilePath({
            requiredFrom: fixturePath('from-node-modules/a.js'),
            raw: 'some-node-module'
        })
        .get('path')
        .should.become(fixturePath('node_modules/some-node-module.js'))
        .notify(done);
    });

    it('Should find a file with a custom extension', function (done) {

        var config = {
            extensions: [
                {
                    extension: '.other'
                }
            ]
        };

        resolver.resolveRequiredFilePath({
            requiredFrom: fixturePath('ext/base.js'),
            raw: './a'
        }, config)
        .get('path')
        .should.become(fixturePath('ext/a.other'))
        .notify(done);
    });

    it('Should find a file with a custom extension - explicitly specified', function (done) {

        var config = {
            extensions: [
                {
                    extension: '.other'
                }
            ]
        };

        resolver.resolveRequiredFilePath({
            requiredFrom: fixturePath('ext/base.js'),
            raw: './a.other'
        }, config)
        .get('path')
        .should.become(fixturePath('ext/a.other'))
        .notify(done);
    });
});