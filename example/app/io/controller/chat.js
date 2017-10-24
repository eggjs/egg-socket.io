'use strict';

module.exports = app => {
  class Controller extends app.Controller {
    * index() {
      const message = this.ctx.args[0];
      console.log('chat :', message + ' : ' + process.pid);
      const say = yield this.service.user.say();
      this.ctx.socket.emit('res', say);
    }
  }
  return Controller;
};
