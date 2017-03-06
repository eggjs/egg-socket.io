'use strict';

const path = require('path');

module.exports = appConfig => {
  const config = {};

  config.io = {
    namespace: {
      '/': {
        connectionMiddleware: ['cookie', 'auth'],
      },
    },
  };

  config.keys = '123';

  config.disconnectFile = path.join(appConfig.baseDir, 'disconnectFile');

  return config;
};
