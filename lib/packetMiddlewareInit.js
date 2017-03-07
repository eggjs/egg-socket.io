'use strict';

const compose = require('koa-compose');
const debug = require('debug')('egg-socket.io:lib:connectionMiddlewareInit.js');

const http = require('http');
const co = require('co');
const extend = require('extend');
const Emitter = require('events').EventEmitter;
const util = require('./util');

const RouterConfigSymbol = Symbol.for('EGG-SOCKET.IO#ROUTERCONFIG');

module.exports = (app, socket, packet, next, packetMiddlewares, nsp) => {
  const request = socket.request;
  request.socket = socket;
  const ctx = app.createContext(request, new http.ServerResponse(request));
  ctx.packet = packet;
  extend(ctx, Emitter.prototype);
  util.delegateSocket(ctx);

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
};
