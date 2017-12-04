'use strict';

module.exports = app => {
  app.io.of('nstest').route('chat', app.io.controller.chat);
};
