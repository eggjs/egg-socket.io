'use strict';

module.exports = app => {
  app.io.route('chat', app.io.controllers.chat.ping);
  app.io.route('chat-generator', app.io.controllers.chat.pingGenerator);
};
