'use strict';

const path = require('path');

module.exports = appConfig => {
  const config = {};

  config.io = {
    namespace: {
      '/': {
        connectionMiddleware: ['auth'],
      },
    },
  };

  config.keys = '123';

  config.redis = {
    client: {
      host: '127.0.0.1',
      port: 6379,
      password: null,
      db: '0',
    },
  }

  config.disconnectFile = path.join(appConfig.baseDir, 'disconnectFile');

  return config;
};
