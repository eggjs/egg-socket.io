'use strict'

module.exports = app => {
  return async (ctx, next) => {
    await next();
    ctx.socket.emit('thisMessageMeansRelease', 'true');
  };
};
