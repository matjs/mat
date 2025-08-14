const debug = require('debug')('combo')
const Stream = require('stream')
const mutil = require('../../util/mutil')
const resHeaderWhiteList = [
  'server',
  'content-type',
  'connection',
  'date',
  'last-modified',
  'cache-control',
  'access-control-allow-origin',
  'access-control-allow-headers',
  'location' // 增加支持302跳转的location
]

module.exports = function combohandler (gen) {
  return function * combohandler (next) {
    debug('--> combohandler')

    // 将请求同时注册事件上限设置为30个
    this.req.setMaxListeners(30)

    const combohandler = this.app.combohandler
    let opts, rules

    if (typeof combohandler === 'object') {
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
      const url = this.url.replace(/(.+[^?])\?{1}[^?].*/, '$1')
      const parts = url.split(opts.trigger)
      const urlHead = parts[0]
      const urlTail = parts[1]
      let urls = urlTail.split(opts.separate)
      urls = urls.map(function (path) {
        return urlHead + path
      })
      let body; const bodys = []

      for (let i = 0; i < urls.length; i++) {
        this.url = urls[i]

        yield gen.call(this, next)

        if (this.body && this.body instanceof Stream) {
          body = yield mutil.cobody(this.body)
        } else if (this.body && typeof this.body === 'string') {
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

    // .ts/.es文件也视为js，设置正确的content-type
    if (/(\.ts|\.es)$/.test(this.request.url)) {
      this.response.set('content-type', 'application-javascript')
    }

    // 只设置白名单里面的header
    if (this.state.resHeaders) {
      // for (let i = 0; i < resHeaderWhiteList.length; i++) {
      //   if (this.state.resHeaders[resHeaderWhiteList[i]]) {
      //     this.set(resHeaderWhiteList[i], this.state.resHeaders[resHeaderWhiteList[i]])
      //   }
      // }

      // 全量设置headers，防止丢失部分header导致请求问题
      const me = this
      
      for (const k in this.state.resHeaders) {
        const v = this.state.resHeaders[k]
        
        // 去掉strict-transport-security 头信息
        if (k !== 'strict-transport-security') {
          me.set(k, v)
        }
      }
    }
  }
}

function match (rules, url) {
  if (!rules || !rules instanceof Array) {
    return true
  }

  const len = rules.length
  let flag

  for (let i = 0; i < len; i++) {
    const rule = rules[i]
    if (typeof rule === 'function') {
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
