#!/usr/bin/env node

var fs        = require('fs');
var exec      = require('child_process').exec;
var joinPath  = require('path').join;
var resolvePath  = require('path').resolve;
var relativePath  = require('path').relative;
var async     = require('async');
var columnify = require('columnify')

var log = console.log.bind(console);
var cwd = process.cwd();

var paths = process.argv.length > 2 ?
    process.argv.slice(2) :
    fs.readdirSync(cwd);

var gitStatus = curryExec('git status --short');

var files = paths.filter(isDirectory).
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
    file.file = relativePath(cwd, file.file);
    return file;
  }).
  sort(function (a, b) {
    return b.changes - a.changes;
  });

  console.log(files.length > 0 ? columnify(files, {
    columns: ['file', 'changes']
  }) : 'i got nothin');
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
