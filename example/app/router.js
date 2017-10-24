'use strict';

module.exports = app => {
  // app.io.of('/')
  app.io.route('chat', app.io.controllers.chat.index);

  // app.io.of('/chat')
  app.io.of('/chat').route('chat', app.io.controllers.chat.index);
};
