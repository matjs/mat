module.exports = function *(next) {
  try {
    yield next
  } catch (error) {
    this.app.emit('error', error)
  }
}