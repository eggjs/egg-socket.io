'use strict';

module.exports = () => {
  return function* (next) {
    const say = yield this.service.user.say();
    this.socket.emit('res', 'auth!' + say);
    yield* next;
    console.log('disconnect!');
  };
};
