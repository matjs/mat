let debug    = require('debug')('proxy')
let thunkify = require('thunkify')
let request  = require('co-request')
let parse    = require('co-body')
let Url      = require('url')

module.exports = function proxy(timeout, limit) {
  return function *proxy(next) {
    debug('--> proxy')
    // 本地请求直接返回，防止死循环
    if (!/^http/.test(this.url) && !this.proxyPass) {
      return
    }

    let url = Url.format({
      protocol: this.protocolAlias || this.protocol,
      host: (this.proxyPass || this.host),
      pathname: this.path,
      search: this.search
    })


    if(this.isChangeOrigin){
      // 解决反向代理到https服务时，本地localhost访问提示认证
      this.headers.host = Url.parse(url).host
    }

    let options = {
      url: url,
      method: this.method,
      headers: this.headers,
      timeout: timeout || 10 * 1000,
      encoding: null,
      //request不处理302自动跳转，抛出来
      followRedirect: function(res){
        return false 
      }
    }
    let isJson = this.is('application/json')
    let isForm = this.is('application/x-www-form-urlencoded')
    let res

    if (isJson) {
      let parsedBody = yield parse.json(this, {
        limit: limit
      })
      options.json = true
      options.body = parsedBody
      let requestThunk = request(options)
      res = yield requestThunk
    } else if (isForm) {
      let parsedBody = yield parse.form(this, {
        limit: limit
      })
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