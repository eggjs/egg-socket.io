'use strict';

module.exports = app => {
  app.io.route('chat', app.io.controller.chat.index);
};
