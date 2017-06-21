'use strict';

exports.io = {
  namespace: {
    '/': {
      connectionMiddleware: [ 'auth' ],
      packetMiddleware: [ 'filter' ],
    },
    '/chat': {
      connectionMiddleware: [ 'auth' ],
      packetMiddleware: [],
    },
  },
};

exports.keys = '123';
