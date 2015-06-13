/* global describe, it */
var chai = require('chai');
chai.should();

var fs = require('fs'), path = require('path');

var sourceMapper = require('../lib/source-mapper');

function fixturePath (relativePath) {
    return path.join(__dirname, 'fixtures', relativePath);
}

describe('The source mapper', function () {
    it('Should extract the chunks from the generated file', function () {
        var code = fs.readFileSync(fixturePath('sourcemaps/entry.package.js')).toString();
        var chunks = sourceMapper.extractChunks(code);
        chunks[0].should.include({
            startLine: 0,
            startColumn: 0
        });
        chunks[1].should.include({
            startLine: 25,
            startColumn: 43
        });
        chunks[2].should.include({
            startLine: 26,
            startColumn: 0
        });
        chunks[3].should.include({
            startLine: 32,
            startColumn: 39
        });
    });

    it('Should build a sourcemap', function () {
        var code = fs.readFileSync(fixturePath('sourcemaps/entry.package.js')).toString();
        sourceMapper.buildSourceMap(code);
    });
});
