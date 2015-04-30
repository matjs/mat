var resolve = require('path').resolve
var send    = require('koa-send')

module.exports = function serve(root, opts) {
  opts = opts || {}

  // options
  opts.root = resolve(root)
  opts.index = opts.index || 'index.html'

  return function *serve(next) {
    if (this.method == 'HEAD' || this.method == 'GET') {
      if (yield send(this, this.path, opts)) return
    }
    yield* next
  }
}