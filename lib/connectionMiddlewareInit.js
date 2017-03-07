'use strict';

const compose = require('koa-compose');
const debug = require('debug')('egg-socket.io:lib:connectionMiddlewareInit.js');
const http = require('http');
const co = require('co');
const util = require('./util');

module.exports = (app, socket, next, connectionMiddlewares) => {
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
  util.delegateSocket(ctx);

  co.wrap(composed).call(ctx)
    .then(next)
    .catch(e => console.log(e));
};
