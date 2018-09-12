'use strict';

exports.io = {
  namespace: {
    '/': {
      connectionMiddleware: ['middleware'],
      packetMiddleware: ['packetware'],
    },
    'ts_of': {}
  }
};

exports.keys = '123';
