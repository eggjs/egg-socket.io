'use strict';

const http = require('http');
const util = require('./util');
const compose = require('koa-compose');
const eggUtil = require('egg-core').utils;
const debug = require('debug')('egg-socket.io:lib:connectionMiddlewareInit.js');

module.exports = (app, socket, next, connectionMiddlewares) => {
  const sessionMiddleware = app.middleware.filter(mw => {
    return mw._name && mw._name.startsWith('session');
  })[0];
  const middlewares = Array.from(connectionMiddlewares);
  middlewares.unshift(sessionMiddleware);

  const composed = compose(middlewares.map(mw => eggUtil.middleware(mw)));
  const request = socket.request;
  request.socket = socket;
  const ctx = app.createContext(request, new http.ServerResponse(request));
  util.delegateSocket(ctx);
  let nexted = false;

  composed(ctx, async () => {
    next();
    nexted = true;
    // after socket emit disconnect, resume middlewares
    await new Promise(resolve => {
      socket.once('disconnect', reason => {
        debug('socket disconnect by: %s', reason);
        resolve(reason);
      });
    });
  })
    .then(() => !nexted && next())
    .catch(e => {
      next(e);// throw to the native socket.io
      app.coreLogger.error(e);
    });
};
