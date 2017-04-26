'use strict';

module.exports = () => {
  return function* () {
    this.socket.emit('chat', 'message send back to client');
  };
};
