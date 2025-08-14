const debug = require('debug')('sse-detector')

/**
 * SSE 检测工具模块
 * 负责检测请求是否为 SSE 类型，以及验证响应是否为有效的 SSE 响应
 */

/**
 * 检测请求是否为 SSE 请求
 * @param {Object} ctx - Koa 上下文对象
 * @param {Object} sseConfig - SSE 配置选项
 * @returns {boolean} 是否为 SSE 请求
 */
function isSSERequest(ctx, sseConfig = {}) {
  debug('--> Detecting SSE request')
  
  // 1. 显式配置启用检查
  if (sseConfig.enabled === true) {
    debug('SSE explicitly enabled in config')
    return true
  }
  
  // 2. Accept 头检测
  const acceptHeader = ctx.headers.accept || ''
  if (acceptHeader.includes('text/event-stream')) {
    debug('SSE detected via Accept header:', acceptHeader)
    return true
  }
  
  debug('No SSE detected for URL:', ctx.url)
  return false
}

/**
 * 验证响应是否为有效的 SSE 响应
 * @param {Object} response - HTTP 响应对象
 * @returns {boolean} 是否为有效的 SSE 响应
 */
function isSSEResponse(response) {
  if (!response || !response.headers) {
    return false
  }
  
  const contentType = response.headers['content-type'] || ''
  const cacheControl = response.headers['cache-control'] || ''
  
  // 检查 Content-Type
  const hasSSEContentType = contentType.includes('text/event-stream')
  
  // 检查缓存控制
  const hasNoCache = cacheControl.includes('no-cache')
  
  debug('SSE response validation:', {
    contentType,
    cacheControl,
    hasSSEContentType,
    hasNoCache
  })
  
  return hasSSEContentType
}

/**
 * 获取 SSE 专用的请求选项
 * @param {Object} baseOptions - 基础请求选项
 * @param {Object} sseConfig - SSE 配置
 * @returns {Object} SSE 专用请求选项
 */
function getSSERequestOptions(baseOptions, sseConfig = {}) {
  const sseOptions = Object.assign({}, baseOptions)
  
  // SSE 专用超时设置
  if (sseConfig.timeout !== undefined) {
    sseOptions.timeout = sseConfig.timeout
  } else {
    // 默认 SSE 无超时限制
    sseOptions.timeout = 0
  }
  
  // 禁用自动重定向
  sseOptions.followRedirect = false
  
  // 设置正确的 Accept 头
  if (!sseOptions.headers) {
    sseOptions.headers = {}
  }
  
  if (!sseOptions.headers.accept) {
    sseOptions.headers.accept = 'text/event-stream'
  }
  
  // 设置缓存控制
  sseOptions.headers['cache-control'] = 'no-cache'
  
  debug('SSE request options:', sseOptions)
  
  return sseOptions
}

/**
 * 获取 SSE 专用的响应头
 * @param {Object} originalHeaders - 原始响应头
 * @returns {Object} SSE 专用响应头
 */
function getSSEResponseHeaders(originalHeaders = {}) {
  const sseHeaders = Object.assign({}, originalHeaders)
  
  // 确保正确的 Content-Type
  if (!sseHeaders['content-type'] || !sseHeaders['content-type'].includes('text/event-stream')) {
    sseHeaders['content-type'] = 'text/event-stream; charset=utf-8'
  }
  
  // 设置缓存控制
  sseHeaders['cache-control'] = 'no-cache'
  
  // 设置连接保持
  sseHeaders['connection'] = 'keep-alive'
  
  // 允许跨域（如果需要）
  if (!sseHeaders['access-control-allow-origin']) {
    sseHeaders['access-control-allow-origin'] = '*'
  }
  
  // 禁用 X-Accel-Buffering（Nginx）
  sseHeaders['x-accel-buffering'] = 'no'
  
  debug('SSE response headers:', sseHeaders)
  
  return sseHeaders
}

/**
 * 创建 SSE 配置验证器
 * @param {Object} config - SSE 配置对象
 * @returns {Object} 验证后的配置
 */
function validateSSEConfig(config = {}) {
  const validConfig = {}
  
  // 验证 enabled 配置
  if (typeof config.enabled === 'boolean') {
    validConfig.enabled = config.enabled
  }
  
  // 验证 timeout 配置
  if (typeof config.timeout === 'number' && config.timeout >= 0) {
    validConfig.timeout = config.timeout
  }
  
  // 验证 keepAlive 配置
  if (typeof config.keepAlive === 'boolean') {
    validConfig.keepAlive = config.keepAlive
  }
  
  // 验证 pathPatterns 配置
  if (Array.isArray(config.pathPatterns)) {
    validConfig.pathPatterns = config.pathPatterns.filter(pattern => {
      return typeof pattern === 'string' || 
             pattern instanceof RegExp || 
             typeof pattern === 'function'
    })
  }
  
  debug('Validated SSE config:', validConfig)
  
  return validConfig
}

module.exports = {
  isSSERequest,
  isSSEResponse,
  getSSERequestOptions,
  getSSEResponseHeaders,
  validateSSEConfig
}
