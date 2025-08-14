/**
 * SSE (Server-Sent Events) 代理配置示例
 * 演示如何在 Mat 中配置和使用 SSE 流式代理
 */

var mat = require('../index')
var proxy = require('./proxy') // 假设有 proxy 中间件

// SSE 基础配置示例
mat.task('sse-basic', function () {
  mat.env({
    port: 8989,
    root: './public',
    timeout: 0 // 支持长连接
  })

  // 基础 SSE 代理 - 通过 URL 模式自动检测
  mat.url([/\/api\/events/, /\/stream/])
    .sse({
      enabled: true,
      timeout: 0,
      keepAlive: true
    })
    .use(proxy({
      proxyPass: 'http://localhost:3000',
      isChangeOrigin: true
    }))
})

// SSE 高级配置示例
mat.task('sse-advanced', function () {
  mat.env({
    port: 8989,
    root: './public'
  })

  // 高级 SSE 配置 - 显式启用和自定义配置
  mat.url([/\/api\/live/, /\/api\/notifications/, /\/api\/realtime/])
    .sse({
      enabled: true, // 显式启用 SSE
      timeout: 30000, // 30秒超时
      keepAlive: true
    })
    .use(proxy({
      proxyPass: 'https://api.example.com',
      isChangeOrigin: true
    }))

  // 常规 API 代理（非 SSE）
  mat.url([/\/api\/(?!.*\/(live|notifications|realtime))/])
    .use(proxy({
      proxyPass: 'https://api.example.com',
      isChangeOrigin: true
    }))
})

// WebSocket 和 SSE 混合配置示例
mat.task('mixed-streaming', function () {
  mat.env({
    port: 8989,
    root: './dist'
  })

  // SSE 事件流
  mat.url([/\/sse/, /\/events/])
    .sse({
      enabled: true,
      timeout: 0
    })
    .use(proxy({
      proxyPass: 'http://stream-server.example.com'
    }))

  // WebSocket 代理（使用原有逻辑）
  mat.url([/\/ws/, /\/socket/])
    .use(proxy({
      proxyPass: 'ws://websocket-server.example.com'
    }))

  // 普通 API 代理
  mat.url([/\/api/])
    .use(proxy({
      proxyPass: 'http://api-server.example.com'
    }))

  // 静态文件（默认处理）
})

// 开发环境 SSE 调试配置
mat.task('sse-debug', function () {
  mat.env({
    port: 8989,
    root: './src',
    log: true, // 启用日志
    logger: function(format, args) {
      console.log('[MAT SSE]', format, args)
    }
  })

  // 启用详细的 SSE 调试 - 通过 Accept 头自动检测
  mat.url([/\/debug\/stream/, /\/test\/sse/])
    .sse({
      enabled: true, // 显式启用调试路径的 SSE
      timeout: 0
    })
    .use(proxy({
      proxyPass: 'http://localhost:3001',
      isChangeOrigin: true
    }))
  
  // 其他路径通过 Accept 头自动检测
  mat.url([/\/.*/])
    .use(proxy({
      proxyPass: 'http://localhost:3001',
      isChangeOrigin: true
    }))
})

// 生产环境 SSE 配置
mat.task('sse-production', function () {
  mat.env({
    port: 8080,
    root: './dist',
    isHttps: true,
    keyPath: './ssl/private.key',
    certPath: './ssl/certificate.crt'
  })

  // 生产环境 SSE 配置
  mat.url([/\/api\/stream/, /\/live/])
    .sse({
      enabled: true,
      timeout: 60000, // 1分钟超时
      keepAlive: true
    })
    .use(proxy({
      proxyPass: 'https://production-api.example.com',
      isChangeOrigin: true
    }))

  // 其他 API 代理
  mat.url([/\/api/])
    .use(proxy({
      proxyPass: 'https://production-api.example.com',
      isChangeOrigin: true,
      timeout: 10000
    }))
})

console.log('Mat SSE Examples Loaded!')
console.log('Available tasks:')
console.log('  - sse-basic: Basic SSE proxy configuration')
console.log('  - sse-advanced: Advanced SSE configuration with custom patterns')
console.log('  - mixed-streaming: SSE and WebSocket mixed configuration')
console.log('  - sse-debug: Development SSE debugging configuration')
console.log('  - sse-production: Production SSE configuration')
console.log('')
console.log('Usage: mat <task-name>')
console.log('Example: mat sse-basic')
