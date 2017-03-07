'use strict';

const fs = require('fs');

module.exports = app => {
  return function* (next) {
    this.emit('packet1', 'packet1');
    yield* next;
    this.emit('packet2', 'packet2');
  };
};
