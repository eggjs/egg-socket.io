'use strict';

/**
 * socket.io default config
 * @member Config#io
 * @property {String} SOME_KEY - some description todo
 */
exports.io = {
  init: {},
  namespace: {
    '/': {
      connectionMiddleware: [],
      packetMiddleware: [],
    },
  },
};
