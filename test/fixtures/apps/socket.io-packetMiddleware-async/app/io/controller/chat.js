'use strict';

module.exports = () => {
  return async ctx => {
    ctx.socket.emit('chat', 'message send back to client');
  };
};
