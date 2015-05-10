var _ = require('lodash')

function Url(rule) {
  this.rule = rule
  this.middlewares = []
}

/**
 * 暂存中间件
 * 返回当前实例，支持链式操作
 */
Url.prototype.use = function(fn) {
  this.middlewares.push(fn)
  return this
}

/**
 * 将暂存的中间件合并为一个中间件
 */
Url.prototype.compose = function() {
  var me = this
  var middlewares = this.middlewares.reverse()

  return function *(next){
    var i = middlewares.length
    var prev = next
    var curr

    while (i--) {
      curr = middlewares[i]
      prev = curr.call(this, prev)
    }

    // 如果请求url满足白名单要求，才会执行此白名单下面的中间件
    if (me._match(this.url)) {
      yield prev
    } else {
      yield next
    }
  }
}

/**
 * 判断请求url是否符合白名单
 */
Url.prototype._match = function (url) {
  var rule = this.rule
  var len = rule.length 
  var flag

  for (var i = 0; i < len; i++) {
    if (_.isFunction(rule[i])) {
      flag = rule[i](url)
    } else {
      flag = rule[i].test(url)
    }

    if (flag) {
      break
    }
  }

  return flag
}

module.exports = Url