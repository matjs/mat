var path    = require('path');
var util    = require('util');
var koa     = require('koa');
var chalk   = require('chalk');
var Orchestrator = require('orchestrator');
var error   = require('./lib/middleware/error');
var forward = require('./lib/middleware/forward');
var mutil   = require('./util/mutil');
var app     = koa();

function Mat() {
  Orchestrator.call(this);
  this.middleware = [];
}

util.inherits(Mat, Orchestrator);

/**
 * Set up project env.
 */
Mat.prototype.env = function (env) {
  if (env.host) {
    app.host = env.host;
  }
  if (env.port) {
    app.port = env.port;
  }
}

/**
 * Rename add to task.
 */
Mat.prototype.task = Mat.prototype.add;

/**
 * Load middleware.
 */
Mat.prototype._middleware = function() {
  app.use(error);

  this.middleware.forEach(function (fn) {
    if (mutil.isGeneratorFunction(fn)) {
      app.use(fn);
    }
  });

  app.use(forward());
};

/**
 * Store the given middleware `fn`.
 */
Mat.prototype.use = function (fn) {
  this.middleware.push(fn);
}

/**
 * Launch server.
 */
Mat.prototype.launch = function () {
  if (!this._start) {
    this._start = true;
    this._middleware();

    app.listen(app.port || 8989, function () {
      console.log(chalk.green('mat is running'));
    });
  }
};

module.exports = new Mat();