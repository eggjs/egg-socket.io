'use strict';

const redis = require('socket.io-redis');
const compose = require('koa-compose');
const assert = require('assert');
const is = require('is-type-of');
const http = require('http');
const extend = require('extend');
const delegate = require('delegates');
const path = require('path');
const co = require('co');
const Emitter = require('events').EventEmitter;
const debug = require('debug')('egg-socket.io:app.js');
const RouterConfigSymbol = Symbol.for('EGG-SOCKET.IO#ROUTERCONFIG');

module.exports = app => {
  const config = app.config.io;

  debug('[egg-socket.io] init start!');

  let dirs = app.loader.getLoadUnits().map(unit => path.join(unit.path, 'app', 'io', 'middleware'));
  app.io.middlewares = app.io.middlewares || {};
  new app.loader.FileLoader({
    directory: dirs,
    target: app.io.middlewares,
    inject: app,
  }).load();

  dirs = app.loader.getLoadUnits().map(unit => path.join(unit.path, 'app', 'io', 'controller'));
  app.io.controllers = app.io.controllers || {};
  new app.loader.FileLoader({
    directory: dirs,
    target: app.io.controllers,
    inject: app,
  }).load();

  debug('[egg-socket.io] app.io.controllers:', app.io.controllers);
  debug('[egg-socket.io] app.io.middlewares:', app.io.middlewares);

  const namespace = config.namespace;

  for (const nsp in namespace) {
    const connectionMiddlewareConfig = namespace[nsp].connectionMiddleware;
    const packetMiddlewareConfig = namespace[nsp].packetMiddleware;

    debug('[egg-socket.io] connectionMiddlewareConfig: ', connectionMiddlewareConfig);
    debug('[egg-socket.io] packetMiddlewareConfig: ', packetMiddlewareConfig);

    const connectionMiddlewares = [];
    const packetMiddlewares = [];

    if (connectionMiddlewareConfig) {
      assert(is.array(connectionMiddlewareConfig), 'config.connectionMiddleware must be Array!');
      for (const middleware of connectionMiddlewareConfig) {
        assert(app.io.middlewares[middleware], `can't find middleware: ${middleware} !`);
        assert(is.generatorFunction(app.io.middlewares[middleware]), `${middleware} must be generatorFunction!`);
        connectionMiddlewares.push(app.io.middlewares[middleware]);
      }
    }

    if (packetMiddlewareConfig) {
      assert(is.array(packetMiddlewareConfig), 'config.packetMiddleware must be Array!');
      for (const middleware of packetMiddlewareConfig) {
        assert(app.io.middlewares[middleware], `can't find middleware: ${middleware} !`);
        assert(is.generatorFunction(app.io.middlewares[middleware]), `${middleware} must be generatorFunction!`);
        packetMiddlewares.push(app.io.middlewares[middleware]);
      }
    }

    debug('[egg-socket.io] initNsp: %s', nsp);

    debug('[egg-socket.io] connectionMiddlewares: ', connectionMiddlewares);
    debug('[egg-socket.io] packetMiddlewares: ', packetMiddlewares);
    initNsp(app.io.of(nsp), connectionMiddlewares, packetMiddlewares);
  }

  function initNsp(nsp, connectionMiddlewares, packetMiddlewares) {
    nsp.on('connection', socket => {
      socket.use((packet, next) => {
        const request = socket.request;
        request.socket = socket;
        const ctx = app.createContext(request, new http.ServerResponse(request));
        ctx.packet = packet;
        extend(ctx, Emitter.prototype);

        delegate(ctx, 'socket')
        .getter('client')
        .getter('server')
        .getter('adapter')
        .getter('id')
        .getter('conn')
        .getter('rooms')
        .getter('acks')
        .getter('json')
        .getter('volatile')
        .getter('broadcast')
        .getter('connected')
        .getter('disconnected')
        .getter('handshake')
        .method('join')
        .method('leave')
        .method('emit')
        .method('to')
        .method('in')
        .method('send')
        .method('write')
        .method('disconnect');

        const composed = compose([ ...packetMiddlewares, function* () {
          packet.push(ctx);
          next();
          if (nsp[RouterConfigSymbol]) {
            debug('[egg-socket.io] wait controller finshed!');
            // after controller execute finished, resume middlewares
            yield done => ctx.on('finshed', done);
          }
        } ]);

        co.wrap(composed).call(ctx).catch(e => console.log(e));
      });
      if (nsp[RouterConfigSymbol]) {
        for (const [ event, handlr ] of nsp[RouterConfigSymbol].entries()) {
          socket.on(event, (...args) => {
            const ctx = args.splice(-1)[0];
            ctx.args = ctx.req.args = args;

            co.wrap(handlr).call(ctx)
              .then(() => {
                ctx.emit('finshed');
              })
              .catch(e => console.log(e));
          });
        }
      }
    });

    nsp.use((socket, next) => {
      const composed = compose([ ...connectionMiddlewares, function* () {
        next();
        // after socket emit disconnect, resume middlewares
        yield function ondisconnect(done) {
          socket.once('disconnect', reason => {
            debug('socket disconnect by %s', reason);
            done(null, reason);
          });
        };
      } ]);

      const request = socket.request;
      request.socket = socket;
      const ctx = app.createContext(request, new http.ServerResponse(request));

      delegate(ctx, 'socket')
        .getter('client')
        .getter('server')
        .getter('adapter')
        .getter('id')
        .getter('conn')
        .getter('rooms')
        .getter('acks')
        .getter('json')
        .getter('volatile')
        .getter('broadcast')
        .getter('connected')
        .getter('disconnected')
        .getter('handshake')
        .method('join')
        .method('leave')
        .method('emit')
        .method('to')
        .method('in')
        .method('send')
        .method('write')
        .method('disconnect');

      co.wrap(composed).call(ctx)
        .then(next)
        .catch(e => console.log(e));
    });
  }

  if (config.redis) {
    app.io.adapter(redis(config.redis));
    debug('[egg-socket.io] init socket.io-redis ready!');
  }

  app.on('server', server => {
    app.io.attach(server);
    debug('[egg-socket.io] init ready!');
  });
};
