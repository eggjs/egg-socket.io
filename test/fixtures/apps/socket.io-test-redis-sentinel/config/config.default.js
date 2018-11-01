'use strict';

exports.io = {
  redis: {
    sentinels: [
      {
        host: '127.0.0.1',
        port: 26379
      },
      {
        host: '127.0.0.1',
        port: 26380
      }
    ],
    name: 'mymaster',
  },
};

exports.keys = '123';
