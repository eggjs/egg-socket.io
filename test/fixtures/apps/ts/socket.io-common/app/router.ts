'use strict';
import { Application } from 'egg';

module.exports = (app: Application) => {
  app.io.route('chat', app.io.controller.chat.ping);
  app.io.of('ts_of').route('chat', app.io.controller.chat.namespacedPing);
};
