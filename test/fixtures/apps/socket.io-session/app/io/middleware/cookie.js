'use strict';

module.exports = app => {
  return function* (next) {
    // we can't send cookie in ioc
    this.header.cookie = this.query.cookie;
    yield* next;
  };
};
