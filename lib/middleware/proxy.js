var thunkify = require('thunkify')
var request  = require('co-request')
var parse    = require('co-body')

module.exports = function proxy() {
  return function *(next) {
    var options = {
      url: this.url,
      method: this.method,
      headers: this.headers,
      timeout: 10*1000
    }
    var isJson = this.is('application/json')
    var isForm = this.is('application/x-www-form-urlencoded')

    if (isJson) {
      var parsedBody = yield parse.json(this)
      options.json = true
      options.body = parsedBody
      var requestThunk = request(options)
      var res = yield requestThunk
    } else if(isForm) {
      var parsedBody = yield parse.form(this)
      options.form = parsedBody
      var requestThunk = request(options)
      var res = yield requestThunk
    } else {
      var requestThunk = request(options)
      var res = yield pipeRequest(this.req, requestThunk)
    }
    
    this.set(res.headers)
    this.status = res.statusCode
    this.body = res.body

    yield next
  }
}

function pipeRequest(req, requestThunk) {
  return function (cb) {
    req.pipe(requestThunk(cb))
  }
}