var moment = require('moment')
var chalk  = require('chalk')
var Log    = require('../../util/log')
var log    = new Log('INFO')

module.exports = function logger() {
  return function *logger(next) {
    var now = moment(new Date()).format('MMMM Do YYYY, h:mm:ss a')

    log.info('%s %s %s', chalk.white('[' + now + ']'), chalk.green(this.method), this.url)

    yield next
  }
}