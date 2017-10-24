'use strict';

exports.ping = async function() {
  await this.socket.emit('res', 'hello');
};
