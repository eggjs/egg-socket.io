import { Context } from 'egg';

module.exports = () => {
    return async (ctx: Context) => {
        ctx.socket.emit('onBefore', 'Before happens!');
    };
};
