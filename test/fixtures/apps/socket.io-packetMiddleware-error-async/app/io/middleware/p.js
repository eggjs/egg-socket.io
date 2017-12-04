'use strict';

module.exports = app => {
  return async (ctx, next) => {
    throw new Error('packetMiddleware Error!');
    await next();
  };
};
