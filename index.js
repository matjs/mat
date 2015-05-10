var path         = require('path')
var util         = require('util')
var koa          = require('koa')
var chalk        = require('chalk')
var Orchestrator = require('orchestrator')
var error        = require('./lib/middleware/error')
var forward      = require('./lib/middleware/forward')
var serve        = require('./lib/middleware/static')
var proxy        = require('./lib/middleware/proxy')
var Url          = require('./lib/url')
var mutil        = require('./util/mutil')
var app          = koa()

function Mat() {
  Orchestrator.call(this)
  this.urls = []
}

util.inherits(Mat, Orchestrator)

/**
 * 设置运行mat服务时需要的参数
 */
Mat.prototype.env = function (env) {
  if (env.port) {
    app.port = env.port
  }
  if (env.root) {
    app.root = env.root
  }
}

/**
 * 将task设置为add方法的别名
 */
Mat.prototype.task = Mat.prototype.add

/**
 * url过滤器
 */
Mat.prototype.url = function (pattern) {
  var url = new Url(pattern)
  this.urls.push(url)
  return url
}

/**
 * 启动mat服务
 */
Mat.prototype.launch = function () {
  if (!this._start) {
    this._start = true
    this._middleware()

    app.listen(app.port || 8989, function () {
      console.log(chalk.green('mat is running'))
    })
  }
}

/**
 * 加载中间件
 */
Mat.prototype._middleware = function() {
  app.use(error)

  app.use(forward())

  this.urls.forEach(function (url) {
    app.use(url.compose())
  })

  app.use(serve(app.root || './'))

  app.use(proxy())
}

module.exports = new Mat()