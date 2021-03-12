module.exports = async (ctx, next) => {
  try {
    await next()
  } catch (error) {
    ctx.app.emit('error', error)
  }
}
