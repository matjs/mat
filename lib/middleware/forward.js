var thunkify = require('thunkify');
var request  = require('../request');

module.exports = function forward() {
  return function *(next) {
    var req = this.req;
    var proxyData;
    var options = {
      url: this.url,
      method: this.method,
      headers: this.headers
    }
    
    if (this.method === 'POST' || this.method == 'PUT') {
      options.body = yield thunkify(_body)(req);
      proxyData = yield thunkify(request)(options);
      _forward.call(this, proxyData);
    } else {
      proxyData = yield thunkify(request)(options);
      _forward.call(this, proxyData);
    }

    yield next;
  }
}

function _body(req, callback) {
  var buffers = [];
  req.on('data', function(chunk){
    buffers.push(chunk);
  });
  req.on('end', function(){
    callback(null, Buffer.concat(buffers));
  });
}

function _forward(proxyData) {
  this.set(proxyData.res.headers);
  this.status = proxyData.res.statusCode;
  this.body = proxyData.data;
}