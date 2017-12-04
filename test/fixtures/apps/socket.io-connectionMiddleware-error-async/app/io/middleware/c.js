'use strict';

module.exports = app => {
  return async (ctx, next) => {
    throw new Error('connectionMiddleware Error!');
    await next();
  };
};
