'use strict';

module.exports = app => {
  app.io.route('generateId', app.io.controller.generateId.ping);
};
