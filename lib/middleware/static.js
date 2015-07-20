var debug   = require('debug')('static')
var resolve = require('path').resolve
var send    = require('koa-send')
var mutil   = require('../../util/mutil')

module.exports = function serve(root, opts) {
  opts = opts || {}
  opts.root = resolve(root)
  opts.index = opts.index || 'index.html'

  return function *serve(next) {
    debug('--> static')
    if (yield send(this, this.path, opts)) {
      // 将stream转成buffer
      this.body = yield mutil.cobody(this.body)

      return
    }
    yield* next
  }
}