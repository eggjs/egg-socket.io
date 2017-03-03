'use strict';

module.exports = () => {
  return function* (next) {
    console.log(this.packet);
    const say = yield this.service.user.say();
    this.socket.emit('res', 'packet!' + say);
    yield* next;
    console.log('packet response!');
  };
};
