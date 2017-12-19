'use strict';

module.exports = (app) => {
  class Controller extends app.Controller {
    async index() {
      throw new Error('Controller Error!');
    }

    async disconnect() {
      throw new Error('Controller Disconnect!');
    }

    async disconnecting() {
      throw new Error('Controller Disconnecting!');
    }
  }
  return Controller
};
