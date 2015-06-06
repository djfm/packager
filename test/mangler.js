var chai = require('chai');
chai.should();

var Mangler = require('../lib/mangler');

/* global describe, it */
describe('The mangler', function () {
    it('should mangle the beginning of strings', function () {
        var mangler = new Mangler();
        mangler.add('a/b/c').add('a/b/d');
        mangler.mangle('a/b/c').should.equal('c');
        mangler.mangle('a/b/d').should.equal('d');
        mangler.mangle('not containing the prefix').should.equal('not containing the prefix');
    });
    it('should never return an empty string', function () {
        var mangler = new Mangler();
        mangler.add('a/b/c').mangle('a/b/c').should.equal('a/b/c');
    });
});
