let moment = require('moment')
let chalk  = require('chalk')
let Log    = require('../../util/log')
let log    = new Log('INFO')

module.exports = function logger() {
  return async (ctx, next) => {
    let now = moment(new Date()).format('MMMM Do YYYY, h:mm:ss a')

    log.info('%s %s %s', chalk.white('[' + now + ']'), chalk.green(ctx.method), ctx.url)

    await next()
  }
}