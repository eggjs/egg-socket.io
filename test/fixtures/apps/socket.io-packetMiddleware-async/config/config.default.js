'use strict';

exports.io = {
  namespace: {
    '/': {
      connectionMiddleware: ['c'],
      packetMiddleware: ['m','r'],
    },
  },
}

exports.keys = '123';
