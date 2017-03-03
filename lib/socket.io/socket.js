'use strict';

const Socket = require('socket.io/lib/socket');

Socket.prototype.__defineGetter__('remoteAddress', function remoteAddressGetter() {
  return this.handshake.address;
});
