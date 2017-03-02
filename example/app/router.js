'use strict';

module.exports = app => {
  // app.io.of('/')
  app.io.route('chat', app.io.controllers.chat);
  app.io.route('hello', app.io.controllers.wechat.hello);
  app.io.route('welcome', app.io.controllers.wechat.welcome);

  // app.io.of('/chat')
  app.io.of('/chat').route('chat', app.io.controllers.chat);
  app.io.of('/chat').route('hello', app.io.controllers.wechat.hello);
  app.io.of('/chat').route('welcome', app.io.controllers.wechat.welcome);
};
