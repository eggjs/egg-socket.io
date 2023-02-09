'use strict'

module.exports = app => {
    return async (ctx, next) => {

        // Here you can generate a unique ID for ctx.socket.id
        // This is only a sample
        // you can also get 'request' through 'ctx.request'
        ctx.socket.id = '1234567890';
        await next();
    };
};