'use strict';

module.exports = app => {
  return function* (next) {
    throw new Error('connectionMiddleware Error!');
    yield* next;
  };
};
