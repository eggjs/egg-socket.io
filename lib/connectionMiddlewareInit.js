'use strict';

const http = require('http');
const util = require('./util');
const compose = require('koa-compose');
const eggUtil = require('egg-core').utils;
const debug = require('debug')('egg-socket.io:lib:connectionMiddlewareInit.js');

module.exports = (app, socket, next, connectionMiddlewares) => {
  connectionMiddlewares = connectionMiddlewares.map(mw => eggUtil.middleware(mw));

  const composed = compose([ ...connectionMiddlewares, async () => {
    next();
    // after socket emit disconnect, resume middlewares
    await new Promise(resolve => {
      socket.once('disconnect', reason => {
        debug('socket disconnect by: %s', reason);
        resolve(reason);
      });
    });
  } ]);

  const request = socket.request;
  request.socket = socket;
  const ctx = app.createContext(request, new http.ServerResponse(request));
  util.delegateSocket(ctx);

  composed(ctx)
    .then(next)
    .catch(e => {
      if (e instanceof Error) {
        e.message = '[egg-socket.io] connection middleware execute error: ' + e.message;
        debug('socket disconnect by: %s', e.message);
      } else /* istanbul ignore next */{
        debug('socket disconnect by: %s', e);
      }
      app.coreLogger.error(e);
    });
};
