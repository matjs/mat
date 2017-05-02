# mat

[![npm version](https://badge.fury.io/js/mat.svg)](http://badge.fury.io/js/mat)

## 文档

详细文档请查看[matjs官方网站](http://matjs.com/)

## 一个简单的matfile例子

```javascript
var mat  = require('mat')
var proxy = require('mat-proxy')

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

// combo url handler
mat.task('combohandler', function () {
  // 开启对combo url的支持
  mat.env({
    combohandler: true
  })

  // 将所有的-min结尾的js重写，去掉-min
  // 并且所有combo的js都会被拆开，分别从本地获取
  // mat会组装这些js，并最终返回一个合并过的js
  mat.url([/\.js/])
    .rewrite([
      [/onlinepath/, 'localpath'],
      [/-min/g, '']
    ])
})
```