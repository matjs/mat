const debug = require('debug')('proxy-sse');
const http = require('http');
const https = require('https');
const http2 = require('http2');
const Url = require('url');
let httpProxy = null;
try {
  httpProxy = require('http-proxy');
} catch (e) {
  httpProxy = null;
}
const parse = require('co-body');
const qs = require('qs');
const Buffer = require('safe-buffer').Buffer;
const sseDetector = require('../../util/sse-detector');

/**
 * SSE 专用代理处理器
 * 处理 Server-Sent Events 的流式代理转发
 */

/**
 * 处理 SSE 代理请求 - 仅使用 http-proxy 方案
 * @param {Object} ctx - Koa 上下文
 * @param {Object} options - 代理配置选项
 * @param {Object} sseConfig - SSE 专用配置
 * @returns {Promise} 处理 Promise
 */
function handleSSEProxy(ctx, options, sseConfig = {}) {
  return new Promise((resolve, reject) => {
    console.log(
      '[MAT-SSE-HANDLER] SSE proxy handler started (http-proxy only)',
    );
    console.log('[MAT-SSE-HANDLER] Target URL:', options.url);

    if (!httpProxy) {
      console.log(
        '[MAT-SSE-HANDLER] ❌ http-proxy not available, falling back to error',
      );
      ctx.status = 500;
      ctx.body = 'SSE Proxy requires http-proxy module';
      resolve();
      return;
    }

    try {
      const parsedUrl = Url.parse(options.url);

      // 目标 IP 与原始域名（SNI/Host）
      const targetIp = parsedUrl.hostname;
      const originalHost = ctx.headers.host || parsedUrl.host;

      // 自定义 HTTPS Agent，设置 SNI 与 keepAlive
      const agent =
        parsedUrl.protocol === 'https:'
          ? new https.Agent({
              keepAlive: true,
              rejectUnauthorized: false,
              servername: originalHost,
              timeout: 0, // 显式禁用 agent 的超时
            })
          : new http.Agent({ keepAlive: true, timeout: 0 });

      // 创建 proxy 实例
      const proxy = httpProxy.createProxyServer({
        changeOrigin: true,
        secure: false,
        xfwd: true,
        agent,
        ignorePath: false,
        selfHandleResponse: false,
        // 移除 proxyTimeout 和 timeout，让其使用默认值（通常是无超时）
      });

      // 监听原始请求的关闭事件，确保代理请求也被终止
      ctx.req.on('close', () => {
        if (!proxy.web) return;
        console.log('[MAT-SSE-HANDLER] Client connection closed, aborting proxy request.');
        proxy.close();
        resolve();
      });

      // 设置事件监听
      proxy.on('proxyReq', pReq => {
        try {
          pReq.setHeader('host', originalHost);
          pReq.setHeader('accept', 'text/event-stream');
          pReq.setHeader('accept-encoding', 'identity');
          pReq.setHeader('connection', 'keep-alive');
          pReq.setHeader('cache-control', 'no-cache');

          // 透传原始请求头
          for (const key in ctx.headers) {
            if (key !== 'host') {
              try {
                pReq.setHeader(key, ctx.headers[key]);
              } catch (e) {}
            }
          }

          console.log('[MAT-SSE-HANDLER] Proxy request headers set');
        } catch (e) {
          console.log(
            '[MAT-SSE-HANDLER] Error setting proxy request headers:',
            e.message,
          );
        }
      });

      proxy.on('proxyRes', (pRes, req, res) => {
        try {
          res.setHeader('x-mat-proxy-origin', 'upstream');
        } catch (e) {}
        console.log(
          '[MAT-SSE-HANDLER] ✅ http-proxy response received:',
          pRes.statusCode,
          pRes.headers['content-type'],
        );

        // 设置 SSE 专用响应头
        try {
          res.setHeader('content-type', 'text/event-stream; charset=utf-8');
          res.setHeader('cache-control', 'no-cache');
          res.setHeader('connection', 'keep-alive');
          res.setHeader('x-accel-buffering', 'no');
        } catch (e) {}
      });

      proxy.on('error', (err, req, res) => {
        console.log(
          '[MAT-SSE-HANDLER] ❌ http-proxy error:',
          err && err.message,
        );
        if (res.destroyed) {
          return resolve();
        }
        try {
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('x-mat-proxy-origin', 'mat');
            res.setHeader('content-type', 'text/plain; charset=utf-8');
            res.end('SSE Proxy Error');
          }
        } catch (e) {
          console.error('[MAT-SSE-HANDLER] Error sending error response:', e);
        }
        resolve();
      });

      // 启用直通输出
      ctx.respond = false;

      // 使用 target 为完整 URL
      const target = `${parsedUrl.protocol}//${targetIp}:${
        parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80)
      }`;
      console.log(
        '[MAT-SSE-HANDLER] http-proxy target:',
        target,
        'host:',
        originalHost,
      );

      proxy.web(ctx.req, ctx.res, {
        target,
        changeOrigin: true,
        secure: false,
        xfwd: true,
        agent,
      });
    } catch (error) {
      console.log(
        '[MAT-SSE-HANDLER] ❌ SSE proxy setup error:',
        error && (error.stack || error.message || error),
      );
      try {
        ctx.set('x-mat-proxy-origin', 'mat');
      } catch (e) {}
      ctx.status = 500;
      ctx.body = 'SSE Proxy Error';
      resolve();
    }
  });
}

/**
 * 创建 SSE 代理中间件
 * @param {Object} options - 代理配置选项
 * @param {Object} sseConfig - SSE 专用配置
 * @returns {Function} Koa 中间件函数
 */
function createSSEProxyMiddleware(options, sseConfig = {}) {
  // 验证 SSE 配置
  const validatedSSEConfig = sseDetector.validateSSEConfig(sseConfig);

  return function* sseProxyMiddleware(next) {
    debug('--> SSE proxy middleware');

    try {
      // 处理 SSE 代理
      yield handleSSEProxy(this, options, validatedSSEConfig);
    } catch (error) {
      debug('SSE proxy middleware error:', error);
      this.status = 500;
      this.body = 'SSE Proxy Error';
    }

    // 注意：SSE 代理不需要调用 next，因为它直接处理响应
    debug('SSE proxy middleware completed');
  };
}

/**
 * 检查连接是否仍然活跃
 * @param {Object} req - 请求对象
 * @returns {boolean} 连接是否活跃
 */
function isConnectionAlive(req) {
  return req && !req.destroyed && req.readable;
}

/**
 * 优雅关闭 SSE 连接
 * @param {Object} proxyReq - 代理请求对象
 * @param {Object} ctx - Koa 上下文
 */
function gracefulCloseSSE(proxyReq, ctx) {
  if (proxyReq && !proxyReq.destroyed) {
    debug('Gracefully closing SSE proxy request');
    proxyReq.abort();
  }

  if (ctx && ctx.res && !ctx.res.headersSent) {
    debug('Gracefully closing SSE response');
    ctx.res.end();
  }
}

module.exports = {
  handleSSEProxy,
  createSSEProxyMiddleware,
  isConnectionAlive,
  gracefulCloseSSE,
};
