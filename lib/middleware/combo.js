var debug    = require('debug')('combo')
var Stream   = require('stream')
var mutil    = require('../../util/mutil')

module.exports = function combohandler(gen, opts) {
  var me = this

  return function *combohandler(next){
    debug('--> combohandler')
    var opts = {
      trigger: '??',
      sep: ','
    }

    if (this.app.combohandler && this.url.indexOf(opts.trigger) !== -1) {
      var url = this.url.replace(/(.+[^?])\?{1}[^?].*/, '$1')
      var parts = url.split(opts.trigger)
      var head = parts[0]
      var tail = parts[1]
      var urls = tail.split(opts.sep)
      urls = urls.map(function(path){
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