'use strict';

module.exports = app => {
  app.io.route('chat', app.io.controller.chat.ping);
  app.io.route('chat-generator', app.io.controller.chat.pingGenerator);
};
