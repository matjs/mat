const Dayjs = require('dayjs')
const chalk = require('chalk')
const Log = require('../../util/log')
const log = new Log('INFO')

module.exports = function logger (_log) {
  return async (ctx, next) => {
    const now = Dayjs(new Date()).format('MMMM Do YYYY, h:mm:ss a')

    if (_log) {
      _log(`${chalk.white('[' + now + ']')} ${chalk.green(ctx.method)} ${ctx.url}`)
    } else {
      log.info('%s %s %s', chalk.white('[' + now + ']'), chalk.green(ctx.method), ctx.url)
    }

    await next()
  }
}
