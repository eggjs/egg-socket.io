'use strict';

const sio = require('socket.io');
const sio_redis = require('socket.io-redis');

module.exports = app => {
  const done = app.readyCallback('egg-websocket');

  app.on('server', server => {
    const io = sio(server);
    io.adapter(sio_redis({
      host: app.config['socket.io'].redis.host,
      port: app.config['socket.io'].redis.port,
    }));
    app['socket.io'] = io;
    done();
  });
};
