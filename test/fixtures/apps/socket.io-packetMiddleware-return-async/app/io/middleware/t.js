'use strict';

module.exports = app => {
  return async (ctx, next) => {
    await next();
    ctx.socket.emit('msg', 'socket.io-packetMiddleware-return-async');
  };
};
