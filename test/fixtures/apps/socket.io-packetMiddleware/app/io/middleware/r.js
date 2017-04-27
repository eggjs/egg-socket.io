'use strict'

module.exports = app => {
  return function* (next) {
    yield* next;
    this.socket.emit('thisMessageMeansRelease', 'true');
  };
};
