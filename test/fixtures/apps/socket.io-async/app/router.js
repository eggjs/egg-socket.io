'use strict';

module.exports = app => {
  app.io.route('chat-async-class', app.io.controller.chatAsyncClass.ping);
  app.io.route('chat-async-object', app.io.controller.chatAsyncObject.ping);
};
