'use strict';

module.exports = app => {
    return function* (next) {
        this.socket.emit('res', 'auth!');
        yield* next;
        console.log('auth midware 后!');
    };
};
