module.exports = {
    extension: '.node',
    compile: function compileDotNode () {
        return 'throw new Error("Cannot load .node files in the browser.");';
    }
};
