var path         = require('path')
var util         = require('util')
var koa          = require('koa')
var compose      = require('koa-compose')
var chalk        = require('chalk')
var Orchestrator = require('orchestrator')
var error        = require('./lib/middleware/error')
var logger       = require('./lib/middleware/logger')
var combo        = require('./lib/middleware/combo')
var serve        = require('./lib/middleware/static')
var proxy        = require('./lib/middleware/proxy')
var Url          = require('./lib/middleware/url')
var mutil        = require('./util/mutil')
var Log          = require('./util/log')
var log          = new Log('INFO')
var app          = koa()

function Mat() {
  Orchestrator.call(this)
  this.init()
}

util.inherits(Mat, Orchestrator)

/**
 * 将task设置为add方法的别名
 */
Mat.prototype.task = Mat.prototype.add

/**
 * 初始化运行参数
 */
Mat.prototype.init = function () {
  app.port = 8989
  app.root = './'
  this.urls = []
}

/**
 * 设置运行参数
 */
Mat.prototype.env = function (env) {
  if (env.port) {
    app.port = env.port
  }
  if (env.root) {
    app.root = env.root
  }
  // 开启combo url解析
  // 默认关闭
  if (env.combohandler) {
    app.combohandler = true
  }
}

/**
 * url过滤器
 */
Mat.prototype.url = function (rules) {
  var url = new Url(rules)
  this.urls.push(url)
  return url
}

/**
 * 启动mat服务
 */
Mat.prototype.launch = function () {
  this._middleware()

  var server = app.listen(app.port, function () {
    log.info()
    log.info(chalk.green('Mat is running on ' + app.port))
    log.info()
  })

  server.on('error', function (e) {
    var message
    if (e.errno === 'EADDRINUSE') {
      message = 'port ' + app.port + ' is already bound.'
    } else {
      message = 'Unknown Error:' + e.message
    }
    log.error("ERROR:", message)
  })
}

/**
 * 加载中间件
 */
Mat.prototype._middleware = function() {
  app.use(error)

  app.use(logger())

  var mw = []
  this.urls.forEach(function (url) {
    mw.push(url.compose())
  })
  var gen = compose(mw)
  app.use(combo(gen))

  app.use(serve(app.root))

  app.use(proxy())
}

module.exports = new Mat()