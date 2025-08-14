# Mat 项目技术规格说明

## 🎯 项目概述

**Mat** 是一个基于 Node.js 的命令行工具，主要用于前端开发中的本地服务器搭建、代理转发和资源管理。它是一个轻量级的开发服务器，特别适合前端开发过程中的调试和测试需求。

## 📋 核心特性

### 1. **HTTP/HTTPS 服务器**
- 支持 HTTP 和 HTTPS 协议
- 可配置端口、根目录等基本参数
- 内置静态文件服务

### 2. **反向代理功能**
- 支持将本地请求代理到远程服务器
- 支持 HTTPS 代理
- 具备 RAP 平台集成支持
- 支持请求头修改和来源变更
- **NEW: SSE (Server-Sent Events) 支持**: 新增专用流式代理处理器，支持实时数据推送和长连接

### 3. **Combo URL 处理**
- 支持类似阿里 CDN 的 combo URL 功能
- 可以将多个资源合并为一个请求 (如：`/path/??file1.js,file2.js`)
- 自动处理资源拆分和合并

### 4. **URL 重写**
- 支持通过正则表达式重写 URL
- 支持函数式 URL 转换
- 适用于开发环境到生产环境的路径映射

### 5. **中间件架构**
- 基于 Koa.js 框架构建
- 模块化的中间件设计
- 支持自定义中间件扩展

## 🏗️ 技术架构

### 核心依赖
- **Koa.js**: Web 框架基础
- **Orchestrator**: 任务管理器 (类似 Gulp)
- **Liftoff**: CLI 工具启动器
- **co-request**: 异步 HTTP 请求

### 中间件系统
1. **Error 中间件**: 错误处理
2. **Logger 中间件**: 请求日志记录
3. **Combo 中间件**: Combo URL 处理
4. **Static 中间件**: 静态文件服务
5. **Proxy 中间件**: 反向代理
6. **URL 中间件**: URL 规则匹配和重写

### 项目结构
```
mat/
├── bin/
│   └── mat                 # CLI 入口文件
├── lib/
│   └── middleware/         # 中间件模块
│       ├── combo.js        # Combo URL 处理
│       ├── error.js        # 错误处理
│       ├── logger.js       # 日志记录
│       ├── proxy.js        # 反向代理
│       ├── static.js       # 静态文件服务
│       └── url.js          # URL 规则匹配
├── util/                   # 工具函数
├── index.js               # 主模块
└── package.json           # 项目配置
```

## 💡 使用场景

### 1. **前端开发调试**
```javascript
// 开发环境代理配置
mat.task('daily', function () {
  mat.url([/\.json/])
    .use(proxy({
      proxyPass: 'your.proxy.host'
    }))
})
```

### 2. **资源合并服务**
```javascript
// Combo URL 处理
mat.task('combohandler', function () {
  mat.env({
    combohandler: true
  })
  
  mat.url([/\.js/])
    .rewrite([
      [/-min/g, '']
    ])
})
```

### 3. **环境切换**
```javascript
// URL 重写实现环境切换
mat.task('online', function () {
  mat.url([/\.js/])
    .rewrite([
      [/-min\.js/g, '.js']
    ])
})
```

### 4. **NEW: SSE (Server-Sent Events) 代理**
```javascript
// SSE 长连接代理配置
mat.task('sse', function () {
  // SSE 接口代理，支持流式传输 - 通过 Accept 头自动检测
  mat.url([/\/api\/events/, /\/stream/])
    .use(proxy({
      proxyPass: 'http://api.example.com',
      isChangeOrigin: true
    }))
  
  // 或者显式启用 SSE
  mat.url([/\/api\/sse/])
    .sse({
      enabled: true,
      timeout: 0, // 无超时限制
      keepAlive: true
    })
    .use(proxy({
      proxyPass: 'http://api.example.com',
      isChangeOrigin: true
    }))
})
```

## 🔧 API 接口

### Mat 类主要方法

#### `mat.env(options)`
配置运行环境参数
- `port`: 服务端口
- `root`: 静态文件根目录
- `isHttps`: 是否启用 HTTPS
- `combohandler`: 是否启用 Combo URL 处理
- `timeout`: 请求超时时间
- `limit`: 请求体大小限制

#### `mat.url(rules)`
创建 URL 规则匹配器
- `rules`: 正则表达式数组或函数数组

#### `mat.task(name, fn)`
定义任务 (继承自 Orchestrator)
- `name`: 任务名称
- `fn`: 任务执行函数

#### `mat.launch()`
启动服务器

### URL 中间件方法

#### `url.use(middleware)`
添加中间件到 URL 规则

#### `url.rewrite(rules)`
配置 URL 重写规则
- `rules`: 重写规则数组 `[[pattern, replacement], ...]`

#### `url.sse(sseConfig)` ⭐ **新增**
配置 SSE (Server-Sent Events) 支持
- `sseConfig.enabled`: 是否显式启用 SSE (boolean)
- `sseConfig.timeout`: SSE 专用超时时间，0 表示无限制 (number)
- `sseConfig.keepAlive`: 是否保持连接活跃 (boolean)

## 📈 版本历史

- **1.0.20** (当前版本): 稳定版本，完整功能支持
- **0.1.15**: 支持 ready 参数回调
- **0.1.14**: 修复 gzip 内容解析问题
- **0.1.13**: 增加超时配置
- **0.1.8-0.1.9**: 增加 Combo URL 支持
- **0.1.0**: 第一个稳定版本，基础功能

## 🎪 适用场景

1. **前端项目本地开发**: 提供静态文件服务
2. **接口代理调试**: 代理到开发/测试环境的 API
3. **资源合并优化**: 处理多文件合并请求
4. **跨域问题解决**: 通过代理解决开发中的跨域问题
5. **路径映射**: 开发环境与生产环境的路径转换

## ⚡ 技术优势

- **轻量级**: 依赖精简，启动快速
- **扩展性**: 基于中间件的架构易于扩展
- **配置灵活**: 支持多种配置方式
- **集成友好**: 可作为其他工具链的一部分
- **任务管理**: 基于 Orchestrator 的任务系统

## 🚀 快速开始

### 安装
```bash
npm install mat
```

### 基本使用
```javascript
var mat = require('mat')

// 基本静态服务
mat.task('default', function() {
  mat.env({
    port: 8989,
    root: './'
  })
})

// 启动服务
mat.start(['default'], function() {
  mat.launch()
})
```

### 命令行使用
```bash
# 启动默认任务
mat

# 启动指定任务
mat taskname

# 指定配置文件
mat --matfile path/to/matfile.js

# 快速代理模式
mat -p 8080
```

## 📝 配置文件示例

典型的 matfile.js:
```javascript
var mat = require('mat')
var proxy = require('mat-proxy')

// 开发环境配置
mat.task('dev', function() {
  mat.env({
    port: 8989,
    root: './src',
    combohandler: true
  })
  
  // API 代理
  mat.url([/\/api\//])
    .use(proxy({
      proxyPass: 'http://dev.example.com'
    }))
    
  // 静态资源重写
  mat.url([/\.js$/])
    .rewrite([
      [/\/build\//, '/src/']
    ])
})

// 生产环境配置
mat.task('prod', function() {
  mat.env({
    port: 8080,
    root: './dist'
  })
})
```

---

*本规格说明基于 Mat v1.0.20 版本分析生成*
