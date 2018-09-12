import { Context } from 'egg';

module.exports = () => {
    return async (ctx: Context, next: Function) => {
        await next();
        ctx.socket.emit('onAfter', 'After happens!');
    };
};
