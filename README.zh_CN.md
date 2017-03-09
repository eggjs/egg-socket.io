# egg-socket.io

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-socket.io.svg?style=flat-square
[npm-url]: https://npmjs.org/package/egg-socket.io
[travis-image]: https://img.shields.io/travis/eggjs/egg-socket.io.svg?style=flat-square
[travis-url]: https://travis-ci.org/eggjs/egg-socket.io
[codecov-image]: https://img.shields.io/codecov/c/github/eggjs/egg-socket.io.svg?style=flat-square
[codecov-url]: https://codecov.io/github/eggjs/egg-socket.io?branch=master
[david-image]: https://img.shields.io/david/eggjs/egg-socket.io.svg?style=flat-square
[david-url]: https://david-dm.org/eggjs/egg-socket.io
[snyk-image]: https://snyk.io/test/npm/egg-socket.io/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/egg-socket.io
[download-image]: https://img.shields.io/npm/dm/egg-socket.io.svg?style=flat-square
[download-url]: https://npmjs.org/package/egg-socket.io

egg 框架的 socket.io 插件

## 安装

```bash
$ npm i egg-socket.io --save
```

## 配置

通过 `config/plugin.js` 配置启动 Socket.IO 插件:

```js
// {app_root}/config/plugin.js
exports.io = {
  enable: true,
  package: 'egg-socket.io',
};
```

在 `config/config.${env}.js` 配置 Socket.IO ：

```js
exports.io = {
  namespace: {
    '/': {
      connectionMiddleware: [],
      packetMiddleware: [],
    },
  },
  redis: {
    host: '127.0.0.1',
    port: 6379
  }
};
```

see [config/config.default.js](config/config.default.js) for more detail.

## 部署

由于 Socket.IO 的设计缘故，多进程的 Socket.IO 服务必须在 `sticky` 模式下才能工作，否则会抛出握手异常。

所以，必须开启 `sticky` 模式：

```js
startCluster({
  sticky: true,
  ...
});
```

## 用法

### 目录结构

```
app
├── io
│   ├── controller
│   │   └── chat.js
│   └── middleware
│       ├── auth.js
│       ├── filter.js
├── router.js
config
 ├── config.default.js
 └── plugin.js
```

### 中间件

middleware are functions which every connection or packet will be processed by.

#### 连接中间件

- 编写连接中间件
`app/io/middleware/auth.js`
```js
module.exports = app => {
    return function* (next) {
        this.socket.emit('res', 'connected!');
        yield* next;
        // execute when disconnect.
        console.log('disconnection!');
    };
};
```
- 配置使之生效

`config/config.default.js`
```js
exports.io = {
  namespace: {
    '/': {
      connectionMiddleware: ['auth'],
    },
  },
};
```

注意，必须配置在特定的命名空间下，才会生效

#### 包中间件

- 编写包中间件
`app/io/middleware/filter.js`
```js
module.exports = app => {
    return function* (next) {
        this.socket.emit('res', 'packet received!');
        console.log('packet:', this.packet);
        yield* next;
    };
};
```
- 配置使之生效

`config/config.default.js`
```js
exports.io = {
  namespace: {
    '/': {
      packetMiddleware: ['filter'],
    },
  },
};
```

注意，必须配置在特定的命名空间下，才会生效

### 控制器

controller is designed to handle the `emit` event from the client.

example:

`app/io/controller/chat.js`
```js
module.exports = app => {
  return function* () {
    const message = this.args[0];
    console.log(message);
    this.socket.emit('res', `Hi! I've got your message: ${message}`);
  };
};
```

下一步，在 `app/router.js` 配置路由
```js
module.exports = app => {
  // or app.io.of('/')
  app.io.route('chat', app.io.controllers.chat);
};
```

## 问题 & 建议

请访问 [here](https://github.com/eggjs/egg/issues).

## 

[MIT](LICENSE)
