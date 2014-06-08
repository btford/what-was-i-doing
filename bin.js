var fs        = require('fs');
var exec      = require('child_process').exec;
var joinPath  = require('path').join;
var async     = require('async');
var columnify = require('columnify')

var log = console.log.bind(console);

var cwd = process.cwd();

var gitStatus = curryExec('git status --short');

var files = fs.readdirSync(cwd).
    map(joinWithCwd).
    filter(isDirectory).
    filter(isGitDirectory);

var UNSTAGED = /^\?\? /,
    MODIFIED = /^(M|D|A) /;

async.map(files, function (file, cb) {
  gitStatus(file, function (err, data) {
    cb(err, err ? null : {
      file: file,
      data: data
    });
  });
}, function (err, files) {
  files = files.filter(function (file) {
    return file.data;
  }).
  map(function (file) {
    file.changes = file.data.
        trim().
        split('\n').
        reduce(function (sum, line) {
          return sum + 0.5 * UNSTAGED.test(line)
                     + MODIFIED.test(line);
        }, 0);
    file.file = file.file.substr(cwd.length + 1);
    return file;
  }).
  sort(function (a, b) {
    return b.changes - a.changes;
  });

  var columns = columnify(files, {
    columns: ['file', 'changes']
  });
  console.log(columns);
});

function curryExec (cmd) {
  return function (cwd, cb) {
    return exec(cmd, { cwd: cwd}, cb);
  };
}

function joinWithCwd (file) {
  return joinPath(cwd, file);
}

function isDirectory(file) {
  return fs.statSync(file).isDirectory();
}

function isGitDirectory(file) {
  return fs.existsSync(joinPath(file, '.git'));
}
