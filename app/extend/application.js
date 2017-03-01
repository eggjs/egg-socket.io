'use strict';

const is = require('is-type-of');
const assert = require('assert');
const SocketIO = require('socket.io');
const Namespace = require('socket.io/lib/namespace');

const SocketIOSymbol = Symbol.for('EGG-SOCKET.IO#IO');
const RouterConfigSymbol = Symbol.for('EGG-SOCKET.IO#ROUTERCONFIG');

Namespace.prototype.route = (event, handlr) => {
  assert(is.string(event), 'event must be string!');
  assert(is.generatorFunction(handlr), 'handlr must be generatorFunction!');

  if (!this[RouterConfigSymbol]) {
    this[RouterConfigSymbol] = new Map();
  }

  if (!this[RouterConfigSymbol].has(event)) {
    this[RouterConfigSymbol].set(event, handlr);
  }
};

SocketIO.prototype.route = function() {
  return this.sockets.route.apply(this.sockets, arguments);
};

module.exports = {
  get io() {
    if (!this[SocketIOSymbol]) {
      this[SocketIOSymbol] = new SocketIO();
      this[SocketIOSymbol].serveClient(false);
    }
    return this[SocketIOSymbol];
  },
};
