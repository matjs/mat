const debug = require('debug')('static')
const resolve = require('path').resolve
const send = require('koa-send')
const mutil = require('../../util/mutil')
const path = require('path')
const fs = require('fs')

module.exports = function serve (root, opts) {
  opts = opts || {}
  opts.root = resolve(root)
  opts.index = opts.index || 'index.html'

  return function * serve (next) {
    debug('--> static')

    if (yield send(this, this.path, opts)) {
      // Mac系统里不区分大小写，但线上cdn地址区分，这里做下兼容
      // 参考：https://zhuanlan.zhihu.com/p/29012766
      // 原理是遍历要找的文件的目录，判断文件名是否跟要请求的资源名相同
      const filePath = opts.root + '/' + this.path
      const basename = path.basename(filePath)
      const dirname = path.dirname(filePath)
      const files = fs.readdirSync(dirname)
      let isExistFile = false
      for (const file of files) {
        if (file === basename) {
          isExistFile = true
          break
        }
      }
      if (!isExistFile) {
        this.body = 'Not Found'
        this.status = 404
        return
      }

      // 将stream转成buffer
      this.body = yield mutil.cobody(this.body)

      return
    }
    yield * next
  }
}
