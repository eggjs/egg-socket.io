'use strict';

module.exports = (app) => {
  class Controller extends app.Controller {
    ping() {
      this.ctx.socket.emit('res', 'hello');
    }
  }
  return Controller
};
