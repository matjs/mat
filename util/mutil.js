let path     = require('path')
let zlib     = require('zlib')
let basename = path.basename
let extname  = path.extname

module.exports = {
  isGenerator: function (obj) {
    return 'function' == typeof obj.next && 'function' == typeof obj.throw
  },
  isGeneratorFunction: function (obj) {
    let constructor = obj.constructor
    if (!constructor) return false
    if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) return true
    return this.isGenerator(constructor.prototype)
  },
  cobody: function (stream) {
    return function(cb) {
      let buffers = []
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