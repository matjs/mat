const debug = require('debug')('proxy')
const request = require('co-request')
const parse = require('co-body')
const Url = require('url')
const mutil = require('../../util/mutil')
const qs = require('qs')
const Buffer = require('safe-buffer').Buffer

module.exports = function proxy (timeout, limit) {
  return function * proxy (next) {
    debug('--> proxy')
    // 本地请求直接返回，防止死循环
    if (!/^http/.test(this.url) && !this.proxyPass) {
      return
    }

    const url = Url.format({
      protocol: this.protocolAlias || this.protocol,
      host: (this.proxyPass || this.host),
      pathname: this.path,
      search: this.search
    })

    if (this.isChangeOrigin) {
      // 解决反向代理到https服务时，本地localhost访问提示认证
      this.headers.host = Url.parse(url).host
    }

    // 本地服务器跑的http，对接线上接口是https时需要正确设置origin
    if (this.headers.origin && this.protocolAlias) {
      this.headers.origin = this.headers.origin.replace(/https?/, this.protocolAlias)
    }

    const options = {
      url: url,
      method: this.method,
      headers: this.headers,
      timeout: timeout || 10 * 1000,
      encoding: null,
      // request不处理302自动跳转，抛出来
      followRedirect: function (res) {
        return false
      },
      // 预发环境https绕过验证
      rejectUnauthorized: false
    }

    // RAP平台增加了接口的校验，所以这里必须加上token
    if (this.isRap) {
      options.qs = {
        __TOKEN__: 'magix-cli'
      }
    }

    const isJson = this.is('application/json')
    const isForm = this.is('application/x-www-form-urlencoded')
    let res
    let parsedBody

    if (isJson) {
      parsedBody = yield parse.json(this, {
        limit: limit
      })
      options.json = true
      options.body = parsedBody

      // 修改content-length可能造成jsonParms格式传参接口出错，待考查
      // options.headers['content-length'] = Buffer.byteLength(qs.stringify(options.body))

      const requestThunk = request(options)
      res = yield requestThunk
    } else if (isForm) {
      parsedBody = yield parse.form(this, {
        limit: limit
      })

      // 如果传参是类似 option[0].tagId=12345，qs.parse会解析成数组，这里还原成原始传参
      // 只支持一层数据结构
      for (const k in parsedBody) {
        const vType = Object.prototype.toString.call(parsedBody[k])

        if (vType === '[object Array]') {
          parsedBody[k].forEach(function (item, i) {
            for (const _k in item) {
              parsedBody[k + '[' + i + '].' + _k] = item[_k]
            }
          })

          delete parsedBody[k]
        } else if (vType === '[object Object]') {
          for (const _k in parsedBody[k]) {
            parsedBody[k + '.' + _k] = parsedBody[k][_k]
          }

          delete parsedBody[k]
        }
      }

      options.form = parsedBody

      // 修改content-length可能造成jsonParms格式传参接口出错，待考查
      options.headers['content-length'] = Buffer.byteLength(qs.stringify(options.form))

      const requestThunk = request(options)
      res = yield requestThunk
    } else {
      const requestThunk = request(options)
      res = yield pipeRequest(this.req, requestThunk)
    }

    // 提供json/post时获取请求里的form data的钩子函数
    // arg1 传参
    // arg2 请求响应
    if (this.getParsedBody) {
      let resbody = res.body
      if (res.headers['content-encoding'] === 'gzip') { // gzip的解压一下
        resbody = yield mutil.counzip(resbody)
      }

      try {
        this.getParsedBody(parsedBody, resbody)
      } catch (error) {
        console.log(error)
      }
    }

    this.state.resHeaders = res.headers
    this.body = res.body
    this.status = res.statusCode

    // 配合@承虎的room浏览器校验插件，增加的RAP的项目id参数
    this.state.resHeaders['x-with-rap'] = this.rapProjectId

    yield next
  }
}

function pipeRequest (req, requestThunk) {
  return function (cb) {
    req.pipe(requestThunk(cb))
  }
}
