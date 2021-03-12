const path = require('path')
const zlib = require('zlib')
const basename = path.basename
const extname = path.extname

module.exports = {
  isGenerator: function (obj) {
    return typeof obj.next === 'function' && typeof obj.throw === 'function'
  },
  isGeneratorFunction: function (obj) {
    const constructor = obj.constructor
    if (!constructor) return false
    if (constructor.name === 'GeneratorFunction' || constructor.displayName === 'GeneratorFunction') return true
    return this.isGenerator(constructor.prototype)
  },
  cobody: function (stream) {
    return function (cb) {
      const buffers = []
      stream.on('data', function (chunk) {
        buffers.push(chunk)
      })
      stream.on('end', function () {
        cb(null, Buffer.concat(buffers))
      })
    }
  },
  counzip: function (buffer) {
    return function (cb) {
      zlib.unzip(buffer, function (err, buffer) {
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
