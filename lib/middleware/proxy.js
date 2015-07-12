var debug    = require('debug')('proxy')
var thunkify = require('thunkify')
var request  = require('co-request')
var parse    = require('co-body')
var Url      = require('url')

module.exports = function proxy() {
  return function *proxy(next) {
    debug('--> proxy')
    // 本地请求直接返回，防止死循环
    if (!/^http/.test(this.url) && !this.proxyPass) {
      return
    }

    var url = Url.format({
      protocol: this.protocol,
      host: (this.proxyPass || this.host),
      pathname: this.path,
      query: this.query
    })

    var options = {
      url: url,
      method: this.method,
      headers: this.headers,
      timeout: 10*1000,
      encoding: null
    }
    var isJson = this.is('application/json')
    var isForm = this.is('application/x-www-form-urlencoded')

    if (isJson) {
      var parsedBody = yield parse.json(this)
      options.json = true
      options.body = parsedBody
      var requestThunk = request(options)
      var res = yield requestThunk
    } else if(isForm) {
      var parsedBody = yield parse.form(this)
      options.form = parsedBody
      var requestThunk = request(options)
      var res = yield requestThunk
    } else {
      var requestThunk = request(options)
      var res = yield pipeRequest(this.req, requestThunk)
    }

    this.set(res.headers)
    this.status = res.statusCode
    this.body = res.body

    yield next
  }
}

function pipeRequest(req, requestThunk) {
  return function (cb) {
    req.pipe(requestThunk(cb))
  }
}