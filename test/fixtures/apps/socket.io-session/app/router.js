'use strict';

module.exports = app => {
  app.get('/home', function* () {
    this.session.user = { name: 'foo' };
    this.body = 'hello';
  });
  app.io.route('chat', app.io.controllers.chat);
};
