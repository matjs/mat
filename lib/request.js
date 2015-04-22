var http  = require('http')
var https = require('https')
var url   = require('url')
var chalk = require('chalk')
var Log   = require('./log')
var log   = new Log('INFO')

module.exports = function(options, callback) {
  var requestUrl
  var requestMethod
  var requestHeaders
  var requestHandler
  var requestOptions
  var request
  var sender
  var requestTimeout
  var responseTimeout
  var buffers

  requestHandler = callback
  requestUrl = options.url

  try {
    requestUrl = url.parse(requestUrl)
  } catch(e) {
    requestHandler(new Error('Invalid url'))
    return
  }

  requestMethod = options.method || 'GET'
  requestHeaders = options.headers

  requestOptions = {
    host: requestUrl.hostname || 'localhost',
    port: requestUrl.port || (requestUrl.protocol === 'https:' ? 443 : 80),
    method: requestMethod,
    path: requestUrl.path,
    headers: requestHeaders
  }

  sender = requestUrl.protocol === 'https:' ? https : http

  requestTimeout = setTimeout(function() {
    log.error('Request timeout for ' + options.url)
    requestTimeout = null
    request.abort()
    requestHandler(new Error('Request timeout'))
  }, 10 * 1000)

  request = sender.request(requestOptions, function(res) {

    clearTimeout(requestTimeout)
    responseTimeout = setTimeout(function() {
      log.error('Response timeout for ' + requestMethod + ' ' + options.url)
      responseTimeout = null
      request.abort()
      requestHandler(new Error('Response timeout'))
    }, 10 * 1000)

    buffers = []
    res.on('data', function(chunk) {
      buffers.push(chunk)
    })

    res.on('end', function() {
      if (responseTimeout) {
        clearTimeout(responseTimeout)
      }
      requestHandler(null, {
        data: Buffer.concat(buffers),
        res: res
      })
    })
  })

  if (requestMethod == 'POST' || requestMethod == 'PUT') {
    request.write(options.body)
  }

  request.on('error', function(err) {
    log.error('url: ' + options.url)
    log.error('msg: ' + err.message)

    if (requestTimeout) {
      clearTimeout(requestTimeout)
    }

    requestHandler(err)
  })

  request.end()
}