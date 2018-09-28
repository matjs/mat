let path = require('path')
let util = require('util')
let koa = require('koa')
let compose = require('koa-compose')
let chalk = require('chalk')
let Orchestrator = require('orchestrator')
let error = require('./lib/middleware/error')
let logger = require('./lib/middleware/logger')
let combo = require('./lib/middleware/combo')
let serve = require('./lib/middleware/static')
let proxy = require('./lib/middleware/proxy')
let Url = require('./lib/middleware/url')
let mutil = require('./util/mutil')
let Log = require('./util/log')
let log = new Log('INFO')
let app = new koa()

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
  if (env.timeout) {
    app.timeout = env.timeout
  }

  if (env.limit) {
    app.limit = env.limit
  }

  if (env.index) {
    app.index = env.index
  }

  if (env.ready) {
    this.ready = env.ready
  }

  // 开启combo url解析
  // 默认关闭
  if (env.combohandler) {
    app.combohandler = env.combohandler
  }
}

/**
 * url过滤器
 */
Mat.prototype.url = function (rules) {
  let url = new Url(rules)
  this.urls.push(url)
  return url
}

/**
 * 启动mat服务
 */
Mat.prototype.launch = function () {
  var me = this
  this._middleware()

  let server = app.listen(app.port, function () {
    // log.info()
    log.info(chalk.green('[mat] Mat is running at port: ' + app.port))
    // log.info()

    me.ready && me.ready(app.port)
  })

  server.on('error', function (e) {
    let message
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
Mat.prototype._middleware = function () {
  app.use(error)

  app.use(logger())

  let mw = []
  this.urls.forEach(function (url) {
    mw.push(url.compose())
  })
  mw.push(serve(app.root, {
    index: app.index
  }))
  mw.push(proxy(app.timeout, app.limit))
  let gen = compose(mw)
  app.use(combo(gen))
}

module.exports = new Mat()