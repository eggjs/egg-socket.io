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

egg plugin for socket.io

## Install

```bash
$ npm i egg-socket.io --save
```

## Configuration

Change `${app_root}/config/plugin.js` to enable Socket.IO plugin:

```js
// {app_root}/config/plugin.js
exports.io = {
  enable: true,
  package: 'egg-socket.io',
};
```

Configure Socket.IO in `${app_root}/config/config.default.js`:

```js
exports.io = {
  init: { } // passed to engine.io
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

#### uws

If you want to replace the default `us` with [uws](https://github.com/uWebSockets/uWebSockets), you can config like this:

```js
exports.io = {
  init: { wsEngine: 'uws' },
};
```

read more about init config at: [engine.io](https://github.com/socketio/engine.io/blob/master/README.md#methods-1) .

see [config/config.default.js](config/config.default.js) for more detail.

## Deployment

### Node Conf

Because of socket.io's design, the multi process socket.io server must work at `sticky` mode.

So, you must start cluster server with `sticky` set to true, otherwise it will cause handshake exception.

```bash
$ # modify your package.json - npm scripts
$ egg-bin dev --sticky
$ egg-scripts start --sticky
```

which will start egg cluster with:

```js
startCluster({
  sticky: true,
  ...
});
```


### Nginx Conf

if you use a nginx proxy server:

```
location / {
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Host $host;
    proxy_pass   http://127.0.0.1:{ your node server port };
}
```

## Usage

### Directory Structure

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

### Middleware

middleware are functions which every connection or packet will be processed by.

#### Connection Middleware

- Write your connection middleware
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
- then config this middleware to make it works.

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

pay attention to the namespace, the config will only work for a specific namespace.

#### Packet Middleware

- Write your packet middleware
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
- then config this middleware to make it works.

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

pay attention to the namespace, the config will only work for a specific namespace.

### Controller

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

You can also use `async/await` in controller:

`app/io/controller/chat.js`
```js
module.exports = app => {
  return async function() {
    const message = this.args[0];
    console.log(message);
    await this.socket.emit('res', `Hi! I've got your message: ${message}`);
  };
};
```

next, config the router at `app/router.js`
```js
module.exports = app => {
  // or app.io.of('/')
  app.io.route('chat', app.io.controllers.chat);
};
```

## Cluster

If your Socket.IO service is powered by mutil server, you must think about cluster solution.It can't work without cluster like broadcast ,rooms and so on.

It's very easy to implement sharing source and event dispatch with with [socket.io-redis](https://github.com/socketio/socket.io-redis) built in.

config at `config/config.${env}.js` ：

```js
exports.io = {
  redis: {
    host: { redis server host },
    port: { redis server prot }
  }
};
```

Application will try to connect the redis server when booting.

## Questions & Suggestions

Please open an issue [here](https://github.com/eggjs/egg/issues).

## License

[MIT](LICENSE)
