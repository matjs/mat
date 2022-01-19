const util = require('util')
const koa = require('koa')
const cors = require('@koa/cors')
const convert = require('koa-convert')
const compose = require('koa-compose')
const chalk = require('chalk')
const Orchestrator = require('orchestrator')
const error = require('./lib/middleware/error')
const logger = require('./lib/middleware/logger')
const combo = require('./lib/middleware/combo')
const serve = require('./lib/middleware/static')
const proxy = require('./lib/middleware/proxy')
const Url = require('./lib/middleware/url')
const Log = require('./util/log')
const log = new Log('INFO')
const https = require('https')
const http = require('http')
const fse = require('fs-extra')

function Mat() {
  this.app = new koa()
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
  this.app.port = 8989
  this.app.root = './'
  this.urls = []
}

/**
 * 设置运行参数
 */
Mat.prototype.env = function (env) {
  this.app.keyPath = env.keyPath
  this.app.certPath = env.certPath
  this.app.isHttps = !!env.isHttps

  if (env.port) {
    this.app.port = env.port
  }

  if (env.root) {
    this.app.root = env.root
  }
  if (env.timeout) {
    this.app.timeout = env.timeout
  }

  if (env.limit) {
    this.app.limit = env.limit
  }

  if (env.index) {
    this.app.index = env.index
  }

  if (env.ready) {
    this.ready = env.ready
  }

  if (env.log) {
    this.app.log = env.log
  }

  if (env.logger) {
    this.app.logger = env.logger
  }

  this.app.koaCorsConfig = env.koaCorsConfig

  // 开启combo url解析
  // 默认关闭
  if (env.combohandler) {
    this.app.combohandler = env.combohandler
  }
}

/**
 * url过滤器
 */
Mat.prototype.url = function (rules) {
  const url = new Url(rules)
  this.urls.push(url)
  return url
}

/**
 * 启动mat服务
 */
Mat.prototype.launch = function () {
  const me = this
  this._middleware()

  let server
  if (this.app.isHttps) {
    const keyPath = this.app.keyPath
    const certPath = this.app.certPath

    // https服务器
    const options = {
      key: fse.readFileSync(keyPath),
      cert: fse.readFileSync(certPath)
    }
    server = https
      .createServer(options, this.app.callback())
      .listen(this.app.port, ready)
  } else {
    // http服务
    server = http.createServer(this.app.callback()).listen(this.app.port, ready)
  }

  function ready() {
    log.info(
      chalk.cyan(
        `[mat] Mat${me.app.isHttps ? '(https)' : '(http)'}服务已启动，端口: ${
          me.app.port
        }`
      )
    )
    me.ready && me.ready(me.app.port)
  }

  server.on('error', function (e) {
    let message
    if (e.errno === 'EADDRINUSE') {
      message = 'port ' + me.app.port + ' is already bound.'
    } else {
      message = 'Unknown Error:' + e.message
    }
    log.error('ERROR:', message)
  })

  this._server = server
}

/**
 * 加载中间件
 */
Mat.prototype._middleware = function () {
  this.app.use(convert(cors(this.app.koaCorsConfig)))
  this.app.use(convert(error))

  if (this.app.log) {
    this.app.use(convert(logger(this.app.logger)))
  }

  const mw = []
  this.urls.forEach(function (url) {
    mw.push(url.compose())
  })
  mw.push(
    serve(this.app.root, {
      index: this.app.index
    })
  )
  mw.push(proxy(this.app.timeout, this.app.limit))
  const gen = compose(mw)
  this.app.use(convert(combo(gen)))
}

// 提供关闭服务的方法
Mat.prototype.close = function () {
  this._server.close()
}

module.exports = Mat
