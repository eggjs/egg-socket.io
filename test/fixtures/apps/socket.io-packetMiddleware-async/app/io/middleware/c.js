'use strict'

module.exports = app => {
  return async (ctx, next) => {
    ctx.socket.on('anEventNotRegisterInTheRouter',() => {});
    await next();
  }
}
