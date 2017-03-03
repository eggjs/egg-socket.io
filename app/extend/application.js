'use strict';

const SocketIO = require('../../lib/socket.io');
const debug = require('debug')('egg-socket.io:app:extend:application.js');

const SocketIOSymbol = Symbol.for('EGG-SOCKET.IO#IO');

module.exports = {
  get io() {
    if (!this[SocketIOSymbol]) {
      debug('[egg-socket.io] create SocketIO instance!');
      this[SocketIOSymbol] = new SocketIO();
      this[SocketIOSymbol].serveClient(false);
    }
    return this[SocketIOSymbol];
  },
};
