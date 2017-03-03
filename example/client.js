'use strict';

// or http://127.0.0.1:7001/chat
const socket = require('socket.io-client')('http://127.0.0.1:7001');

socket.on('connect', () => {
  console.log('connect!');
  socket.emit('chat', 'hello world!');
});

socket.on('res', msg => {
  console.log('res from server: %s!', msg);
});
