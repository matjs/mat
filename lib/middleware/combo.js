let debug     = require('debug')('combo')
let _         = require('lodash')
let Stream    = require('stream')
let mutil     = require('../../util/mutil')
let resHeaderWhiteList = [
  'server',
  'content-type',
  'connection',
  'date',
  'last-modified',
  'cache-control',
  'access-control-allow-origin',
  'access-control-allow-headers',
  'location' //增加支持302跳转的location
]

module.exports = function combohandler(gen) {
  return function *combohandler(next) {
    debug('--> combohandler')

    // 将请求同时注册事件上限设置为30个
    this.req.setMaxListeners(30)

    let combohandler = this.app.combohandler
    let opts, rules

    if (typeof combohandler == 'object') {
      opts = {
        trigger: combohandler.trigger || '??',
        separate: combohandler.separate || ','
      }
      rules = combohandler.rules
    } else {
      opts = {
        trigger: '??',
        separate: ','
      }
    }

    if (combohandler && match(rules, this.url) && this.url.indexOf(opts.trigger) !== -1) {
      let url = this.url.replace(/(.+[^?])\?{1}[^?].*/, '$1')
      let parts = url.split(opts.trigger)
      let urlHead = parts[0]
      let urlTail = parts[1]
      let urls = urlTail.split(opts.separate)
      urls = urls.map(function(path) {
        return urlHead + path
      })
      let body, bodys = []

      for (let i = 0; i < urls.length; i++) {
        this.url = urls[i]

        yield gen.call(this, next)

        if (this.body && this.body instanceof Stream) {
          body = yield mutil.cobody(this.body)
        } else if (this.body && typeof this.body == 'string') {
          body = new Buffer(this.body)
        } else if (this.state.resHeaders && this.state.resHeaders['content-encoding'] == 'gzip') {
          // 返回的内容被gzip过需要ungzip，不然有可能乱码
          body = yield mutil.counzip(this.body)
        } else {
          body = this.body
        }

        bodys.push(body)
      }
      body = Buffer.concat(bodys)
      this.body = body
    } else {
      yield gen.call(this, next)

      // 对于单个请求需要把content-encoding加上
      // 不然返回的内容为gzip的情况，浏览器解析会出错
      resHeaderWhiteList.push('content-encoding')
    }

    // 只设置白名单里面的header
    if (this.state.resHeaders) {
      for (let i = 0; i < resHeaderWhiteList.length; i++) {
        if (this.state.resHeaders[resHeaderWhiteList[i]]) {
          this.set(resHeaderWhiteList[i], this.state.resHeaders[resHeaderWhiteList[i]])
        }
      }
    }
  }
}

function match(rules, url) {
  if (!rules || !rules instanceof Array) {
    return true
  }

  let len = rules.length
  let flag

  for (let i = 0; i < len; i++) {
    let rule = rules[i]
    if (_.isFunction(rule)) {
      flag = rule(url)
    } else {
      flag = rule.test(url)
    }

    if (flag) {
      break
    }
  }

  return flag
}