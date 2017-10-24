'use strict';

module.exports = (app) => {
  // Note: egg (http) doesn't support this style. Keep it consistent
  // return async function(){
  //   await this.socket.emit('res', 'hello');
  // };
  class Controller extends app.Controller {
    async ping() {
      await this.ctx.socket.emit('res', 'hello');
    }
  }
  return Controller
};
