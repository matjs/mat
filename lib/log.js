var fmt   = require('util').format;
var chalk = require('chalk');

module.exports = Log;

exports.ERROR = 0;

exports.WARNING = 1;

exports.INFO = 2;

exports.DEBUG = 3;

function Log(level){
  if ('string' == typeof level) level = exports[level.toUpperCase()];
  this.level = level || exports.DEBUG;
  this.stream = process.stdout;
}

Log.prototype = {
  log: function(levelStr, args) {
    if (exports[levelStr] <= this.level) {
      var msg = fmt.apply(null, args);

      switch(levelStr) {
        case 'ERROR':
          msg = chalk.red(msg);
          break;
        case 'WARNING':
          msg = chalk.yellow(msg);
          break;
        case 'INFO':
          msg = chalk.cyan(msg);
          break;
        case 'DEBUG':
          msg = chalk.green(msg);
          break;
      }

      this.stream.write(msg + '\n');
    }
  },
  error: function(msg){
    this.log('ERROR', arguments);
  },
  warning: function(msg){
    this.log('WARNING', arguments);
  },
  info: function(msg){
    this.log('INFO', arguments);
  },
  debug: function(msg){
    this.log('DEBUG', arguments);
  }
}