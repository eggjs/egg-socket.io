'use strict';

const http = require('http');
const util = require('./util');
const Emitter = require('events').EventEmitter;
const debug = require('debug')('egg-socket.io:lib:packetMiddlewareInit.js');

const CtxEventSymbol = Symbol.for('EGG-SOCKET.IO#CTX-EVENT');
const RouterConfigSymbol = Symbol.for('EGG-SOCKET.IO#ROUTERCONFIG');

module.exports = (app, socket, packet, next, packetMiddlewares, nsp) => {
  const request = socket.request;
  request.socket = socket;
  const ctx = app.createContext(request, new http.ServerResponse(request));
  ctx.packet = packet;
  ctx[CtxEventSymbol] = new Emitter();
  util.delegateSocket(ctx);

  packetMiddlewares(ctx, async () => {
    packet.push(ctx);
    next();
    const eventName = packet[0];
    const routerMap = nsp[RouterConfigSymbol];
    if (routerMap && routerMap.has(eventName)) {
      debug('[egg-socket.io] wait controller finshed!');
      // after controller execute finished, resume middlewares
      await new Promise((resolve, reject) => {
        ctx[CtxEventSymbol].on('finshed', error => {
          debug('[egg-socket.io] controller execute finished, resume middlewares');
          if (!error) resolve();
          else reject(error);
        });
      });
    }
  })
    .catch(e => {
      next(e);// throw to the native socket.io
      app.coreLogger.error(e);
    });
};
