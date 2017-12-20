'use strict';

module.exports = app => {
  app.io.route('chat', app.io.controller.chat.index);
  app.io.route('disconnect', app.io.controller.chat.disconnect);
  app.io.route('disconnecting', app.io.controller.chat.disconnecting);
};
