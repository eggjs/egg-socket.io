'use strict';

module.exports = () => {
  return async function(){
    await this.socket.emit('res', 'hello');
  };
};
