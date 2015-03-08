var parse = require('shell-quote').parse;
var exec = require('child_process').exec;
var through = require('through2');
var combine = require('stream-combiner2');
var duplexer = require('duplexer2');
var writeonly = require('write-only-stream');
var fs = require('fs');

module.exports = function (str, opts) {
    if (!opts) opts = {};
    var env = opts.env || process.env;
    if (str === '-') {
        var w = writeonly(createout(function () {
            w.emit('exit');
        }));
        return w;
    };
    
    var parts = parse(str, env);
    var op = 'write';
    for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (p.op === '|' || p.op === '>') {
            op = 'exec';
            break;
        }
    }
    var groups = [ { args: [], op: op } ];
    
    for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        var args = groups[groups.length-1].args;
        
        if (typeof p === 'string') {
            args.push(p);
        }
        else if (p.op === '>') {
            groups.push({ op: 'write', args:[] });
        }
        else if (p.op === '|') {
            groups.push({ op: 'exec', args:[] });
        }
        else {
            args.push(p.op);
        }
    }
    var stdout = createout(function () {
        stream.emit('exit');
    });
    var stream = writeonly(combine(groups.filter(filter).map(function (g) {
        if (g.op === 'write') {
            var w = fs.createWriteStream(g.args.join(' '));
            w.once('finish', function () { out.end() });
            var out = through();
            return duplexer(w, out);
        }
        else if (g.op === 'exec') {
            var ps = exec(g.args.join(' '));
            return duplexer(ps.stdin, ps.stdout);
        }
    }).concat(stdout)));
    return stream;
    
    function filter (x) { return x.args.length > 0 }
};

function createout (done) {
    return through(write, end);
    function write (buf, enc, next) {
        process.stdout.write(buf);
        next();
    }
    function end () { if (done) done.call(this) }
}
