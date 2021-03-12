Status = {}
Msg = {}

Status.BadDigest = 400
Status.BadMethod = 405
Status.Internal = 500
Status.InvalidArgument = 409
Status.InvalidContent = 400
Status.InvalidCredentials = 401
Status.InvalidHeader = 400
Status.InvalidVersion = 400
Status.MissingParameter = 409
Status.NotAuthorized = 403
Status.PreconditionFailed = 412
Status.RequestExpired = 400
Status.RequestThrottled = 429
Status.ResourceNotFound = 404
Status.WrongAccept = 406

Msg.BadDigest = 400
Msg.BadMethod = 405
Msg.Internal = '服务器出错'
Msg.InvalidArgument = '参数无效'
Msg.InvalidContent = 400
Msg.InvalidCredentials = 401
Msg.InvalidHeader = 400
Msg.InvalidVersion = 400
Msg.MissingParameter = '缺少参数'
Msg.NotAuthorized = '未授权'
Msg.PreconditionFailed = 412
Msg.RequestExpired = 400
Msg.RequestThrottled = 429
Msg.ResourceNotFound = '未找到相关资源'
Msg.WrongAccept = '错误请求类型'

Object.keys(Status).forEach(function (key) {
  exports[key] = Status[key]
  exports[key + 'Error'] = function (message) {
    const error = new Error(message || Msg[key])
    error.name = 'MATError'
    error.status = Status[key]
    return error
  }
})
