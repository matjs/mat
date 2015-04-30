module.exports = matdata

function matdata(ctx) {
  return {
    get url() {
      return this.url
    },
    set url(val) {
      this.url = val
    },
    get method() {
      return ctx.method
    },
    set method(val) {
      this.method = val
    },
    get headers() {
      return ctx.headers
    },
    set headers(val) {
      this.headers = val
    },
    set status(val) {
      this.status = val
    },
    set body(val) {
      this.body = val
    }
  }
}