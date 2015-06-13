/* global describe, it */
var chai = require('chai');
var path = require('path');
var packager = require('../lib/packager');

chai.use(require('chai-as-promised'));
chai.should();

function fixturePath (relativePath) {
    return path.join(__dirname, 'fixtures', relativePath);
}

describe('Packager', function () {
    it('Should list the deps, starting at some entry point', function (done) {
        var main = fixturePath('nocycle/a.js');

        packager.listRequiredFiles(main).get('files').should.eventually.deep.equal([
            {
                raw: './b',
                path: fixturePath('nocycle/b.js'),
                requiredFrom: main
            },
            {
                raw: './c',
                path: fixturePath('nocycle/c.js'),
                requiredFrom: fixturePath('nocycle/b.js')
            }
        ]).notify(done);
    });

    it('Should list the deps, not getting crazy about cycles', function (done) {
        var main = fixturePath('cycle/a.js');

        packager.listRequiredFiles(main).get('files').should.eventually.deep.equal([
            {
                raw: './b',
                path: fixturePath('cycle/b.js'),
                requiredFrom: main
            },
            {
                raw: './c',
                path: fixturePath('cycle/c.js'),
                requiredFrom: fixturePath('cycle/b.js')
            },
            {
                raw: './a',
                path: fixturePath('cycle/a.js'),
                requiredFrom: fixturePath('cycle/c.js')
            }
        ]).notify(done);
    });

    it('Should package a very simple app with only one file trivially required', function (done) {
        packager.package(fixturePath('simple/entry.js')).then(function (package) {
            /* jshint evil:true */
            eval(package.code).should.equal(42);
            done();
        }).fail(done);
    });

    it('Should package an app that requires (relatively) 2 modules with the same name', function (done) {
        packager.package(fixturePath('different-module-versions-relative/entry.js')).then(function (package) {
            /* jshint evil:true */
            eval(package.code).should.equal('the one and the other a');
            done();
        }).fail(done);
    });

    it('Should package an app that requires 2 modules with the same name but in different node_module folders', function (done) {
        packager.package(fixturePath('different-module-versions-node_modules/entry.js')).then(function (package) {
            /* jshint evil:true */
            eval(package.code).should.equal('the one and the other a');
            done();
        }).fail(done);
    });

    it('Should not make the resulting script evaluate modules until they\'re required at runtime', function (done) {
        packager.package(fixturePath('dont-evaluate-until-required/entry.js')).then(function (package) {
            /* jshint evil:true */
            eval(package.code).should.equal('required module wasnt actually used');
            done();
        }).fail(done);
    });
});