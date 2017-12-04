'use strict';

const path = require('path');

module.exports = appConfig => {
  const config = {};

  config.io = {
    namespace: {
      '/': {
        connectionMiddleware: ['m'],
      },
    },
  };

  config.disconnectFile = path.join(appConfig.baseDir, 'disconnectFile');

  config.keys = '123';

  return config;
};
