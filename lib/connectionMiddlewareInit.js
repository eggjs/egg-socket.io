'use strict';

const http = require('http');
const util = require('./util');
const debug = require('debug')('egg-socket.io:lib:connectionMiddlewareInit.js');

module.exports = (app, socket, next, connectionMiddlewares) => {
  const request = socket.request;
  request.socket = socket;
  const ctx = app.createContext(request, new http.ServerResponse(request));
  util.delegateSocket(ctx);
  let nexted = false;

  connectionMiddlewares(ctx, async () => {
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
