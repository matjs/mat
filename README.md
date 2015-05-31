# mat

[![npm version](https://badge.fury.io/js/mat.svg)](http://badge.fury.io/js/mat)

## 文档

详细文档请查看[matjs官方网站](http://matjs.com/)

## 一个简单的matfile例子

```javascript
var mat  = require('mat')
var rap  = require('mat-rap')
var proxy = require('mat-proxy')

// rap模拟数据
mat.task('default', function () {
  mat.url([/\.json/])
    .use(rap({
      projectId: 'your rap project id'
    }))
})

// 反向代理
mat.task('daily', function () {
  mat.url([/\.json/])
    .use(proxy({
      proxyPass: 'your.proxy.host'
    }))
})

// url重写
mat.task('online', function () {
  mat.url([/\.js/])
    .rewrite([
      [/-min\.js/g, '.js']
    ])
})
```