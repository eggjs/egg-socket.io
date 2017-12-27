'use strict';

module.exports = app => {
  class Controller extends app.Controller {
    async index() {
      this.ctx.socket.emit('res', 'demo');
    }
  }
  return Controller
};
