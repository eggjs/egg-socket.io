'use strict';

const redis = require('socket.io-redis');
const assert = require('assert');
const is = require('is-type-of');
const co = require('co');
const debug = require('debug')('egg-socket.io:lib:io.js');
const RouterConfigSymbol = Symbol.for('EGG-SOCKET.IO#ROUTERCONFIG');

const loader = require('./loader');
const connectionMiddlewareInit = require('./connectionMiddlewareInit');
const packetMiddlewareInit = require('./packetMiddlewareInit');

module.exports = app => {
  loader(app);
  const config = app.config.io;
  const logger = app.coreLogger;

  debug('[egg-socket.io] init start!');

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
        packetMiddlewareInit(app, socket, packet, next, packetMiddlewares, nsp);
      });

      if (nsp[RouterConfigSymbol]) {
        for (const [ event, handlr ] of nsp[RouterConfigSymbol].entries()) {
          socket.on(event, (...args) => {
            const ctx = args.splice(-1)[0];
            ctx.args = ctx.req.args = args;
            co.wrap(handlr).call(ctx)
              .then(() => ctx.emit('finshed'))
              .catch(e => {
                e.message = '[egg-socket.io] controller execute error: ' + e.message;
                logger.error(e);
              });
          });
        }
      }
    });

    nsp.use((socket, next) => {
      connectionMiddlewareInit(app, socket, next, connectionMiddlewares);
    });
  }

  if (config.redis) {
    app.io.adapter(redis(config.redis));
    debug('[egg-socket.io] init socket.io-redis ready!');
  }

  app.on('server', server => {
    app.io.attach(server, config.init);
    debug('[egg-socket.io] init ready!');
  });
};
