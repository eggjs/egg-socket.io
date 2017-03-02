'use strict';

module.exports = app => {
  app.io.route('chat', app.io.controllers.chat);
};
