var debug     = require('debug')('combo')
var _         = require('lodash')
var Stream    = require('stream')
var mutil     = require('../../util/mutil')
var headerKey = ['server', 'content-type', 'connection', 'date', 'last-modified', 'cache-control', 'access-control-allow-origin']

module.exports = function combohandler(gen) {
  return function *combohandler(next){
    debug('--> combohandler')

    var combohandler = this.app.combohandler

    if (typeof combohandler == 'object') {
      var opts = {
        trigger: combohandler.trigger || '??',
        separate: combohandler.separate || ','
      }
      var rules = combohandler.rules
    } else {
      var opts = {
        trigger: '??',
        separate: ','
      }
    }

    if (
      combohandler &&
      match(rules, this.url) &&
      this.url.indexOf(opts.trigger) !== -1
    ) {
      var url = this.url.replace(/(.+[^?])\?{1}[^?].*/, '$1')
      var parts = url.split(opts.trigger)
      var head = parts[0]
      var tail = parts[1]
      var urls = tail.split(opts.separate)
      urls = urls.map(function(path) {
        return head + path
      })
      var body
      var bodys = []

      for (var i = 0; i < urls.length; i++) {
        this.url = urls[i]

        yield gen.call(this, next)

        if (this.body && this.body instanceof Stream) {
          body = yield mutil.cobody(this.body)
        } else if (this.body && typeof this.body == 'string') {
          body = new Buffer(this.body)
        } else if (this.headersOut && this.headersOut['content-encoding'] == 'gzip') {
          // 返回的内容被gzip过需要ungzip，不然有可能乱码
          body = yield mutil.counzip(this.body)
        } else {
          body = this.body
        }

        bodys.push(body)
      }
      // 最后返回的数据被统一成buffer
      body = Buffer.concat(bodys)

      // 反向代理的情况需要手动设置header
      if (this.headersOut) {
        for (var i = 0; i < headerKey.length; i++) {
          if (this.headersOut[headerKey[i]]) {
            this.set(headerKey[i], this.headersOut[headerKey[i]])
          }
        }
      }
      
      this.body = body
    } else {
      yield gen.call(this, next)

      this.set(this.headersOut)
    }
  }
}

function match(rules, url) {
  if (!rules || !rules instanceof Array) {
    return true
  }

  var len = rules.length
  var flag

  for (var i = 0; i < len; i++) {
    var rule = rules[i]
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