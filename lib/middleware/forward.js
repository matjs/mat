var matdata = require('../matdata')

module.exports = function forward() {
  return function *(next) {
    // this.matdata = Object.create(matdata(this))

    yield next

    this.set(this.headers)
    this.status = this.status || 200
    this.body = this.body
  }
}