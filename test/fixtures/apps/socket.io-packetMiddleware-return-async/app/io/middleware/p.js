'use strict';

module.exports = app => {
  return async (ctx, next) => {
    return;
    await next();
  };
};
