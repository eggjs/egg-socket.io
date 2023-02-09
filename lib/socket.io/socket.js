'use strict';

const Socket = require('socket.io').Socket;

/* istanbul ignore next */
Socket.prototype.__defineGetter__('remoteAddress', function remoteAddressGetter() {
  return this.handshake.address;
});
