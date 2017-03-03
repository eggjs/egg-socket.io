'use strict';

const mm = require('egg-mock');
const assert = require('assert');
const ioc = require('socket.io-client');

let basePort = 17001;

// Creates a socket.io client for the given server
function client(nsp = '', opts) {
  const url = `http://127.0.0.1:${basePort++}` + nsp;
  return ioc(url, opts);
}

describe('test/socketio.test.js', () => {
  afterEach(mm.restore);

  it('should single worker works ok', done => {
    const app = mm.cluster({
      baseDir: 'apps/socket.io-test',
      workers: 1,
      sticky: false,
    });
    app.ready().then(() => {
      const socket = client();
      socket.on('connect', () => socket.emit('chat', ''));
      socket.on('error', done);
      socket.on('res', msg => {
        assert(msg === 'hello');
        app.close().then(done, done);
      });
    });
  });

  it.skip('should mutil process works ok with sticky mode', done => {
    const app = mm.cluster({
      baseDir: 'apps/socket.io-test',
      workers: 2,
      sticky: true,
    });
    app.ready().then(() => {
      const socket = client();
      socket.on('connect', () => socket.emit('chat', ''));
      socket.on('error', done);
      socket.on('res', msg => {
        assert(msg === 'hello');
        app.close().then(done, done);
      });
    });
  });

  it('should redis adapter works ok', done => {
    const app = mm.cluster({
      baseDir: 'apps/socket.io-test-redis',
      workers: 2,
      sticky: true,
    });
    app.ready().then(() => {
      const socket = client();
      socket.on('connect', () => socket.emit('chat', ''));
      socket.on('error', done);
      socket.on('res', msg => {
        assert(msg === 'hello');
        app.close().then(done, done);
      });
    });
  });
});
