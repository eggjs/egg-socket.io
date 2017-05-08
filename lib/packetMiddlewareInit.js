'use strict';

const compose = require('koa-compose');
const debug = require('debug')('egg-socket.io:lib:packetMiddlewareInit.js');

const http = require('http');
const co = require('co');

const Emitter = require('events').EventEmitter;
const util = require('./util');

const RouterConfigSymbol = Symbol.for('EGG-SOCKET.IO#ROUTERCONFIG');
const CtxEventSymbol = Symbol.for('EGG-SOCKET.IO#CTX-EVENT');

module.exports = (app, socket, packet, next, packetMiddlewares, nsp) => {
  const request = socket.request;
  request.socket = socket;
  const ctx = app.createContext(request, new http.ServerResponse(request));
  ctx.packet = packet;
  ctx[CtxEventSymbol] = new Emitter();
  util.delegateSocket(ctx);
  const composed = compose([ ...packetMiddlewares, function* () {
    packet.push(ctx);
    next();
    const eventName = packet[0];
    const routerMap = nsp[RouterConfigSymbol];
    if (routerMap && routerMap.has(eventName)) {
      debug('[egg-socket.io] wait controller finshed!');
      // after controller execute finished, resume middlewares
      yield done => ctx[CtxEventSymbol].on('finshed', e => {
        debug('[egg-socket.io] controller execute finished, resume middlewares');
        done(e);
      });
    }
  } ]);

  co.wrap(composed).call(ctx).catch(e => {
    debug('egg**********');
    e.message = '[egg-socket.io] packet middleware execute error: ' + e.message;
    app.coreLogger.error(e);
  });
};
