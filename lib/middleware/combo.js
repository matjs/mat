var debug    = require('debug')('combo')
var Stream   = require('stream')
var _        = require('lodash')
var mutil    = require('../../util/mutil')

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
        } else {
          body = this.body
        }

        bodys.push(body)
      }

      body = Buffer.concat(bodys)
      this.set('Content-Length', body.length)
      this.type = mutil.fileType(url)
      this.body = body
    } else {
      yield gen.call(this, next)
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