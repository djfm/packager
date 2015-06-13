var _ = require('underscore');
var sourceMap = require('source-map');

function extractChunks (sourceCode) {
    var tag = /(\/\*__sourcemap__(?:start|end)__of__file__ (?:.*?)\*\/)/;
    var exp = /\/\*__sourcemap__(start|end)__of__file__ (.*?)\*\//;

    var parts = sourceCode.split(tag);

    var chunks = [];

    var currentFile = null;
    _.each(parts, function (part) {
        var special = exp.exec(part);

        if (special) {
            if ('start' === special[1]) {
                currentFile = special[2];
            } else if ('end' === special[1]) {
                if (special[2] !== currentFile) {
                    throw new Error('Ill-formed source file.');
                }
                currentFile = null;
            }
            chunks.push({
                code: part,
                file: null
            });
        } else {
            chunks.push({
                code: part,
                file: currentFile
            });
        }
    });

    var currentNoFileChunk = null;
    var mergedChunks = [];

    _.each(chunks, function (chunk) {
        if (chunk.file) {
            mergedChunks.push(chunk);
            currentNoFileChunk = null;
        } else if (currentNoFileChunk) {
            currentNoFileChunk.code += chunk.code;
        } else {
            currentNoFileChunk = chunk;
            mergedChunks.push(currentNoFileChunk);
        }
    });

    chunks = mergedChunks;

    var line = 0, column = 0;

    _.each(chunks, function (chunk) {
        chunk.startLine = line;
        chunk.startColumn = column;

        for (var i = 0; i < chunk.code.length; ++i) {
            if (chunk.code[i] === '\n') {
                ++line;
                column = 0;
            } else {
                ++column;
            }
        }
    });

    return chunks;
}

function buildSourceMap (sourceCode) {

    var chunks = extractChunks(sourceCode);

    var nodes = _.map(chunks, function (chunk) {
        return new sourceMap.SourceNode(
            chunk.startLine,
            chunk.startColumn,
            chunk.file,
            chunk.code
        );
    });

    var rootNode = new sourceMap.SourceNode(0, 0, null, nodes);

    var map = rootNode.toStringWithSourceMap().map;

    _.each(chunks, function (chunk) {
        if (chunk.file) {
            map.setSourceContent(chunk.file, chunk.code);
        }
    });


    return map;
}

exports.extractChunks = extractChunks;
exports.buildSourceMap = buildSourceMap;
