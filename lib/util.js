'use strict';

const delegate = require('delegates');

exports.delegateSocket = ctx => {
  delegate(ctx, 'socket')
    .getter('client')
    .getter('server')
    .getter('adapter')
    .getter('id')
    .getter('conn')
    .getter('rooms')
    .getter('acks')
    .getter('json')
    .getter('volatile')
    .getter('broadcast')
    .getter('connected')
    .getter('disconnected')
    .getter('handshake')
    .method('join')
    .method('leave')
    .method('emit')
    .method('to')
    .method('in')
    .method('send')
    .method('write')
    .method('disconnect');
};
