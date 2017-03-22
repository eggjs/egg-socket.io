'use strict';

const mm = require('egg-mock');
const assert = require('assert');
const request = require('supertest');
const fs = require('fs');
const pedding = require('pedding');
const path = require('path');
const rimraf = require('rimraf');
const ioc = require('socket.io-client');

let basePort = 17001;

function client(nsp = '', opts = {}) {
  let url = 'http://127.0.0.1:' + opts.port + (nsp || '');
  if (opts.query) {
    url += '?' + opts.query;
  }
  return ioc(url, opts);
}

const mockApps = fs.readdirSync(path.join(__dirname, 'fixtures/apps'));

describe('test/socketio.test.js', () => {
  beforeEach(() => {
    mockApps.forEach(clean);
  });

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
      socket.on('disconnect', () => app.close().then(done, done));
      socket.on('res', msg => {
        assert(msg === 'hello');
        socket.close();
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
      socket.on('disconnect', () => app.close().then(done, done));
      socket.on('res', msg => {
        assert(msg === 'hello');
        socket.close();
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
      socket.on('disconnect', () => app.close().then(done, done));
      socket.on('res', msg => {
        assert(msg === 'hello');
        socket.close();
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
        socket.on('disconnect', () => app.close().then(done, done));
        socket.on('packet1', () => done());
        socket.on('packet2', () => socket.close());
        socket.on('connect', () => socket.emit('a', ''));
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
            socket.on('disconnect', () => app.close().then(done, done));
            socket.on('forbidden', () => socket.close());
          });
      });
    });
  });

  describe('error', () => {
    it('Controller error', done => {
      const appName = 'socket.io-controller-error';
      const app = mm.cluster({
        baseDir: `apps/${appName}`,
        workers: 2,
        sticky: true,
      });

      app.ready().then(() => {
        const socket = client('', { port: basePort });
        socket.on('disconnect', () => app.close().then(done, done));
        socket.on('connect', () => socket.emit('chat', ''));
        setTimeout(() => {
          const errorLog = getErrorLogContent(appName);
          assert(contains(errorLog, 'Controller Error!') === 1);
          done();
        }, 500);
      });
    });

    it('connectionMiddleware error', done => {
      const appName = 'socket.io-connectionMiddleware-error';
      const app = mm.cluster({
        baseDir: `apps/${appName}`,
        workers: 2,
        sticky: true,
      });

      app.ready().then(() => {
        const socket = client('', { port: basePort });
        socket.on('disconnect', () => app.close().then(done, done));
        socket.on('connect', () => socket.emit('chat', ''));
        setTimeout(() => {
          const errorLog = getErrorLogContent(appName);
          assert(contains(errorLog, 'connectionMiddleware Error!') === 1);
          done();
        }, 500);
      });
    });

    it('packetMiddleware error', done => {
      const appName = 'socket.io-packetMiddleware-error';
      const app = mm.cluster({
        baseDir: `apps/${appName}`,
        workers: 2,
        sticky: true,
      });

      app.ready().then(() => {
        const socket = client('', { port: basePort });
        socket.on('disconnect', () => app.close().then(done, done));
        socket.on('connect', () => socket.emit('chat', ''));
        setTimeout(() => {
          const errorLog = getErrorLogContent(appName);
          assert(contains(errorLog, 'packetMiddleware Error!') === 1);
          done();
        }, 500);
      });
    });
  });
});

function clean(name) {
  const logPath = path.join(__dirname, 'fixtures/apps', name, 'logs');
  const runPath = path.join(__dirname, 'fixtures/apps', name, 'run');

  rimraf.sync(logPath);
  rimraf.sync(runPath);
}

function getErrorLogContent(name) {
  const logPath = path.join(__dirname, 'fixtures/apps', name, 'logs', name, 'common-error.log');
  return fs.readFileSync(logPath, 'utf8');
}

function contains(content, match) {
  return content.split('\n').filter(line => line.indexOf(match) >= 0).length;
}
