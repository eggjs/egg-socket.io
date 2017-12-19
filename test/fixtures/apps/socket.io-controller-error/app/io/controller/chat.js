'use strict';

module.exports = (app) => {
  class Controller extends app.Controller {
    * index() {
      throw new Error('Controller Error!');
    }

    * disconnect() {
      throw new Error('Controller Disconnect!');
    }

    * disconnecting() {
      throw new Error('Controller Disconnecting!');
    }
  }
  return Controller
};
