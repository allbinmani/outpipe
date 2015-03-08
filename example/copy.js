var outfile = require('../');
var fs = require('fs');
var path = require('path');
var xtend = require('xtend');

var minimist = require('minimist');
var argv = minimist(process.argv.slice(2), {
    alias: { o: 'outfile' }
});

var outputs = [];

argv._.forEach(function (file, ix) {
    if (outputs.length === 0) {
        var env = xtend(process.env, { FILE: path.basename(file) });
        var out = outfile(argv.outfile, { env: env });
        outputs.push.apply(outputs, out);
        out = outputs[ix];
    }
    var out = outputs[ix] || process.stdout
    fs.createReadStream(file).pipe(out);
});
