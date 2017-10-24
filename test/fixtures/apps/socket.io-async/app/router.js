'use strict';

module.exports = app => {
  app.io.route('chat-async-class', app.io.controllers.chatAsyncClass.ping);
  app.io.route('chat-async-object', app.io.controllers.chatAsyncObject.ping);
};
