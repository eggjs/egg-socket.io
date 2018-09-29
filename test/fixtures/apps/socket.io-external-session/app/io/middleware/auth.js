'use strict';

const fs = require('fs');

module.exports = app => {
  if (fs.existsSync(app.config.disconnectFile)) {
    fs.unlinkSync(app.config.disconnectFile);
  }
  return function* (next) {
    if (!this.session.user) {
      throw new Error('auth failed!');
    }
    this.emit('join', app.config.disconnectFile);

    yield* next;

    fs.writeFileSync(app.config.disconnectFile, 'true');
  };
};
