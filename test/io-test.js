'use strict';

const mm = require('egg-mock');
const assert = require('assert');
const request = require('supertest');
const fs = require('fs');
const pedding = require('pedding');
const ioc = require('socket.io-client');

let basePort = 17001;

function client(nsp = '', opts = {}) {
  let url = 'http://127.0.0.1:' + opts.port + (nsp || '');
  if (opts.query) {
    url += '?' + opts.query;
  }
  return ioc(url, opts);
}

describe('test/socketio.test.js', () => {
  afterEach(() => {
    mm.restore();
    basePort++;
  });

  it('should single worker works ok', done => {
    const app = mm.cluster({
      baseDir: 'apps/socket.io-test',
      workers: 1,
      sticky: false,
    });
    app.ready().then(() => {
      const socket = client('', { port: basePort });
      socket.on('connect', () => socket.emit('chat', ''));
      socket.on('error', done);
      socket.on('res', msg => {
        assert(msg === 'hello');
        app.close().then(done, done);
      });
    });
  });

  it('should mutil process works ok with sticky mode', done => {
    const app = mm.cluster({
      baseDir: 'apps/socket.io-test',
      workers: 2,
      sticky: true,
    });
    app.ready().then(() => {
      const socket = client('', { port: basePort });
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
      const socket = client('', { port: basePort });
      socket.on('connect', () => socket.emit('chat', ''));
      socket.on('error', done);
      socket.on('res', msg => {
        assert(msg === 'hello');
        app.close().then(done, done);
      });
    });
  });

  describe('connectionMiddleware', () => {
    it('should connectionMiddleware works ok when connection established & disconnected', done => {
      const app = mm.cluster({
        baseDir: 'apps/socket.io-connectionMiddleware',
        workers: 2,
        sticky: true,
      });

      app.ready().then(() => {
        const socket = client('', { port: basePort });
        socket.on('error', done);
        socket.on('connected', disconnectFile => {
          socket.close();
          setTimeout(() => {
            assert(fs.readFileSync(disconnectFile).toString(), 'true');
            fs.unlinkSync(disconnectFile);
            app.close().then(done, done);
          }, 500);
        });
      });
    });
  });

  describe('packetMiddleware', () => {
    it('should packetMiddleware works ok', _done => {
      const app = mm.cluster({
        baseDir: 'apps/socket.io-packetMiddleware',
        workers: 2,
        sticky: true,
      });
      const done = pedding(_done, 2);
      app.ready().then(() => {
        const socket = client('', { port: basePort });
        socket.on('error', done);
        socket.on('packet1', () => {
          done();
        });
        socket.on('packet2', () => {
          app.close().then(done, done);
        });
        socket.on('connect', () => {
          socket.emit('a', '');
        });
      });
    });
  });

  describe('session', () => {
    it('with session allowed', done => {
      const app = mm.cluster({
        baseDir: 'apps/socket.io-session',
        workers: 2,
        sticky: true,
      });

      app.ready().then(() => {
        const req = request(`http://127.0.0.1:${basePort}`);
        req.get('/home')
          .expect(200)
          .expect('hello', function requestDone(err, res) {
            assert(!err, err);
            const cookie = encodeURIComponent(res.headers['set-cookie'].join(';'));
            const socket = client('', { query: 'cookie=' + cookie, port: basePort });
            socket.on('connect', () => socket.emit('chat', ''));
            socket.on('error', done);
            socket.on('forbidden', () => done(new Error('forbidden')));
            let disconnectFile = '';
            socket.on('join', p => { disconnectFile = p; });
            socket.on('res', msg => {
              assert(msg === 'foo');
              socket.close();
              setTimeout(() => {
                assert(fs.readFileSync(disconnectFile).toString(), 'true');
                fs.unlinkSync(disconnectFile);
                app.close().then(done, done);
              }, 500);
            });
          });
      });
    });

    it('without session forbidden', done => {
      const app = mm.cluster({
        baseDir: 'apps/socket.io-session',
        workers: 2,
        sticky: true,
      });

      app.ready().then(() => {
        const req = request(`http://127.0.0.1:${basePort}`);
        req.get('/home')
          .expect(200)
          .expect('hello', function requestDone(err) {
            assert(!err, err);
            const socket = client('', { port: basePort });
            socket.on('error', done);
            socket.on('forbidden', () => {
              app.close().then(done, done);
            });
          });
      });
    });
  });
});
