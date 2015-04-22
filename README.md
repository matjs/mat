# mat

[![npm version](https://badge.fury.io/js/mat.svg)](http://badge.fury.io/js/mat)

## 文档

详细文档请查看[matjs官方网站](http://matjs.github.io/)

## 一个简单的matfile例子

```javascript
var mat  = require('mat')
var rap  = require('mat-rap')
var opoa = require('mat-opoa')
var res  = require('mat-respond')

// rap mock数据环境
mat.task('default', function () {
  mat.use(rap({
    projectId: '123'
  }))

  mat.use(opoa({
    root: './'
  }))
})

// daily环境数据反向代理
mat.task('daily', function () {
  mat.use(opoa({
    root: './',
    proxy: 'www.abc.net'
  }))
})

// 线上环境静态资源映射
mat.task('online', function () {
  mat.use(res([
    // 将线上的js映射到本地
    {
      pattern: 'boot/index-min.js',
      responder: '/Users/naij/project/boot/index.js'
    }, 
    // 将-min后缀的js映射到非-min的js
    {
      pattern: '(.*)-min.js',
      responder: '$1.js'
    }
  ]))
})
```