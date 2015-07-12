var debug   = require('debug')('static')
var resolve = require('path').resolve
var send    = require('koa-send')

module.exports = function serve(root, opts) {
  opts = opts || {}
  opts.root = resolve(root)
  opts.index = opts.index || 'index.html'

  return function *serve(next) {
    debug('--> static')
    if (yield send(this, this.path, opts)) {
      return
    }
    yield* next
  }
}