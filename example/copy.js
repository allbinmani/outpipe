var outpipe = require('../');
var fs = require('fs');
var path = require('path');
var xtend = require('xtend');

var minimist = require('minimist');
var argv = minimist(process.argv.slice(2), {
    alias: { o: 'output' }
});

var outputs = [];
argv._.forEach(function (file, ix) {
    if (ix >= outputs.length) {
        var env = xtend(process.env, { FILE: path.basename(file) });
        var files = outpipe(argv.output, { env: env });
        outputs.push.apply(outputs, files);
    }
    var out = outputs[ix] || process.stdout
    fs.createReadStream(file).pipe(out);
});
