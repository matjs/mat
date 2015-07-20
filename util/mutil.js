var path     = require('path')
var zlib     = require('zlib')
var basename = path.basename
var extname  = path.extname

module.exports = {
  isGenerator: function (obj) {
    return 'function' == typeof obj.next && 'function' == typeof obj.throw
  },
  isGeneratorFunction: function (obj) {
    var constructor = obj.constructor
    if (!constructor) return false
    if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) return true
    return this.isGenerator(constructor.prototype)
  },
  cobody: function (stream) {
    return function(cb) {
      var buffers = []
      stream.on('data', function(chunk) {
        buffers.push(chunk)
      })
      stream.on('end', function() {
        cb(null, Buffer.concat(buffers))
      })
    }
  },
  counzip: function (buffer) {
    return function (cb) {
      zlib.unzip(buffer, function(err, buffer) {
        if (!err) {
          cb(null, buffer)
        } else {
          cb(err)
        }
      })
    }
  },
  fileType: function (file) {
    return extname(basename(file, '.gz'))
  }
}