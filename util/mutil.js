module.exports = {
  isGenerator: function (obj) {
    return 'function' == typeof obj.next && 'function' == typeof obj.throw
  },
  isGeneratorFunction: function (obj) {
    var constructor = obj.constructor
    if (!constructor) return false
    if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) return true
    return this.isGenerator(constructor.prototype)
  }
}