'use strict';

module.exports = () => {
  return function* (next) {
    const say = yield this.service.user.say();
    this.socket.emit('res', 'packet!' + say);
    yield* next;
  };
};
