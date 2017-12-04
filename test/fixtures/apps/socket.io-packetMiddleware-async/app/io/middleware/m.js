'use strict';

const fs = require('fs');

module.exports = app => {
  return async (ctx, next) => {
    ctx.emit('packet1', 'packet1');
    await next();
    ctx.emit('packet2', 'packet2');
  };
};
