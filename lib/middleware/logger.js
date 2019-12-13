let moment = require('moment')
let chalk = require('chalk')
let Log = require('../../util/log')
let log = new Log('INFO')

module.exports = function logger(_log) {
  return async (ctx, next) => {
    let now = moment(new Date()).format('MMMM Do YYYY, h:mm:ss a')

    if (_log) {
      _log(`${chalk.white('[' + now + ']')} ${chalk.green(ctx.method)} ${ctx.url}`)
    } else {
      log.info('%s %s %s', chalk.white('[' + now + ']'), chalk.green(ctx.method), ctx.url)
    }

    await next()
  }
}