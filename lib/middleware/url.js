const debug = require('debug')('url')

function Url (rules) {
  this.rules = rules
  this.middlewares = []
}

/**
 * 保存中间件
 */
Url.prototype.use = function (fn) {
  this.middlewares.splice(1, 0, fn)
  return this
}

/**
 * 重写url的中间件
 */
Url.prototype.rewrite = function (rules) {
  const _rewrite = function * rewrite (next) {
    debug('--> url rewrite')
    let url = this.url
    const len = rules.length

    for (let i = 0; i < len; i++) {
      const rule = rules[i]
      if (typeof rule === 'function') {
        url = rule(url) || url
      } else {
        url = url.replace(rule[0], rule[1])
      }
    }

    this.url = url

    yield next
  }

  // 保证rewrite中间件永远是第一个
  this.middlewares.splice(0, 0, _rewrite)
  return this
}

/**
 * 将暂存的中间件合并为一个中间件
 */
Url.prototype.compose = function () {
  const me = this
  const middlewares = me.middlewares

  return function * (next) {
    debug('--> url compose')
    let i = middlewares.length
    let prev = next
    let curr

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
  const rules = this.rules
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

module.exports = Url
