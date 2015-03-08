var parse = require('shell-quote').parse;
var exec = require('child_process').exec;
var through = require('through2');
var expand = require('brace-expansion');
var combine = require('stream-combiner2');
var duplexer = require('duplexer2');
var fs = require('fs');

module.exports = function (str, opts) {
    if (!opts) opts = {};
    var env = opts.env || process.env;
    
    return expand(str).map(function (s) {
        var parts = parse(s, env);
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
        var stdout = through(function (buf, enc, next) {
            process.stdout.write(buf);
            next();
        });
        
        return combine(groups.filter(filter).map(function (g) {
            if (g.op === 'write') {
                var w = fs.createWriteStream(g.args.join(' '));
                return duplexer(w, through());
            }
            else if (g.op === 'exec') {
                var ps = exec(g.args.join(' '));
                return duplexer(ps.stdin, ps.stdout);
            }
        }).concat(stdout));
        
        function filter (x) { return x.args.length > 0 }
    });
};
