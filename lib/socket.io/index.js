'use strict';

const SocketIO = require('socket.io');
require('./namespace');
require('./socket');

SocketIO.prototype.route = function() {
  return this.sockets.route.apply(this.sockets, arguments);
};

module.exports = SocketIO;
