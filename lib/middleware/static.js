module.exports = function serve() {
  return function *(next) {
    yield next
  }
}