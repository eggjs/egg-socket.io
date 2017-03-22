'use strict';

module.exports = app => {
  return function* (next) {
    throw new Error('packetMiddleware Error!');
    yield* next;
  };
};
