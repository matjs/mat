let debug    = require('debug')('proxy')
let thunkify = require('thunkify')
let request  = require('co-request')
let parse    = require('co-body')
let Url      = require('url')

module.exports = function proxy() {
  return function *proxy(next) {
    debug('--> proxy')
    // 本地请求直接返回，防止死循环
    if (!/^http/.test(this.url) && !this.proxyPass) {
      return
    }

    let url = Url.format({
      protocol: this.protocol,
      host: (this.proxyPass || this.host),
      pathname: this.path,
      search: this.search
    })

    let options = {
      url: url,
      method: this.method,
      headers: this.headers,
      timeout: 10*1000,
      encoding: null
    }
    let isJson = this.is('application/json')
    let isForm = this.is('application/x-www-form-urlencoded')
    let res

    if (isJson) {
      let parsedBody = yield parse.json(this)
      options.json = true
      options.body = parsedBody
      let requestThunk = request(options)
      res = yield requestThunk
    } else if (isForm) {
      let parsedBody = yield parse.form(this)
      options.form = parsedBody
      let requestThunk = request(options)
      res = yield requestThunk
    } else {
      let requestThunk = request(options)
      res = yield pipeRequest(this.req, requestThunk)
    }

    this.state.resHeaders = res.headers
    this.body = res.body
    this.status = res.statusCode

    yield next
  }
}

function pipeRequest(req, requestThunk) {
  return function (cb) {
    req.pipe(requestThunk(cb))
  }
}