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

## Requirements

- Node.js >= 8.0
- Egg.js >= 2.0

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
  init: { }, // passed to engine.io
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

**Egg's socket is using `ws`, [uws](https://www.npmjs.com/package/uws) is deprecated due to [some reasons](https://github.com/socketio/socket.io/issues/3319).**

If you insist using this, please config like this following:

```js
exports.io = {
  init: { wsEngine: 'uws' },
};
```

- For more options in `init` : [engine.io](https://github.com/socketio/engine.io/blob/master/README.md#methods-1).
- For more configs of `Egg Socket` in default : [config.default.js](config/config.default.js).

### generateId

**Note:** This function is left on purpose to override and generate a unique ID according to your own rule:

```js
exports.io = {
  generateId: (request) => {
        // Something like UUID.
        return 'This should be a random unique ID';
    }
};
```

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
    return async (ctx, next) => {
        ctx.socket.emit('res', 'connected!');
        await next();
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
    return async (ctx, next) => {
        ctx.socket.emit('res', 'packet received!');
        console.log('packet:', this.packet);
        await next();
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
  class Controller extends app.Controller {
    async ping() {
      const message = this.ctx.args[0];
      await this.ctx.socket.emit('res', `Hi! I've got your message: ${message}`);
    }
  }
  return Controller
};

 // or async functions
exports.ping = async function() {
  const message = this.args[0];
  await this.socket.emit('res', `Hi! I've got your message: ${message}`);
};
```

next, config the router at `app/router.js`
```js
module.exports = app => {
  // or app.io.of('/')
  app.io.route('chat', app.io.controller.chat.ping);
};
```

### Router

A router is mainly responsible for distributing different events corresponding to a controller on a specific socket connection.

It should be configured at `app/router.js` refer to the last chapter.

Besides that, there are several system Event:

- `disconnecting` doing the disconnect
- `disconnect` connection has disconnected.
- `error` Error occured

Example：

`app/router.js`
```js
app.io.route('disconnect', app.io.controller.chat.disconnect);
```

`app/io/controller/chat.js`
```js
module.exports = (app) => {
  class Controller extends app.Controller {
    async disconnect() {
      const message = this.ctx.args[0];
      console.log(message);
    }
  }
  return Controller
};
```

### Session

The session is supported by `egg-socket.io`. It behaviour just like the normal HTTP session. 

Session creates or check just happens at the handshake period. Session can be accessed by `ctx.session` in packetMiddleware and controller, but it's only created at the at the handshake period.

The feature is powered by [egg-session](https://github.com/eggjs/egg-session), make sure it has been enabled.

## Cluster

If your Socket.IO service is powered by mutil server, you must think about cluster solution.It can't work without cluster like broadcast ,rooms and so on.

It's very easy to implement sharing source and event dispatch with with [socket.io-redis](https://github.com/socketio/socket.io-redis) built in.

config at `config/config.${env}.js` ：

```js
exports.io = {
  redis: {
    host: { redis server host },
    port: { redis server prot },
    auth_pass: { redis server password },
    db: 0,
  }
};
```
if you want to use redis sentinel mode, the config should be:

```js
exports.io = {
  redis: {
    sentinels:{ a list of sentinels with ip and port },
    name: { group name of sentinel instances }
  }
};
```

Application will try to connect the redis server when booting.

## Questions & Suggestions

Please open an issue [here](https://github.com/eggjs/egg/issues).

## License

[MIT](LICENSE)
