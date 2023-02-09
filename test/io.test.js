'use strict';

const mm = require('egg-mock');
const assert = require('assert');
const request = require('supertest');
const fs = require('fs');
const pedding = require('pedding');
const path = require('path');
const rimraf = require('rimraf');
const ioc = require('socket.io-client');
const compile = require('child_process');

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
  before(() => {
    mockApps.forEach(clean);
  });

  afterEach(() => {
    mm.restore();
    basePort++;
  });

  it('should async/await works ok', done => {
    const app = mm.cluster({
      baseDir: 'apps/socket.io-async',
      workers: 1,
      sticky: false,
    });
    app.ready().then(() => {
      const socket = client('', { port: basePort });
      let success = 0;
      socket.on('connect', () => {
        socket.emit('chat-async-class', '');
        socket.emit('chat-async-object', '');
      });
      socket.on('disconnect', () => app.close().then(done, done));
      socket.on('res', msg => {
        assert(msg === 'hello');
        if (++success === 2) {
          socket.close();
        }
      });
    });
  });

  it('should controller class works ok', done => {
    const app = mm.cluster({
      baseDir: 'apps/socket.io-controller-class',
      workers: 1,
      sticky: false,
    });
    app.ready().then(() => {
      const socket = client('', { port: basePort });
      let success = 0;
      socket.on('connect', () => {
        socket.emit('chat', '');
        socket.emit('chat-generator', '');
      });
      socket.on('disconnect', () => app.close().then(done, done));
      socket.on('res', msg => {
        assert(msg === 'hello');
        if (++success === 2) {
          socket.close();
        }
      });
    });
  });

  it('should customize generateId works ok', done => {
    const app = mm.cluster({
      baseDir: 'apps/socket.io-generateId',
      workers: 1,
      sticky: false,
    });
    app.ready().then(() => {
      const socket = client('', { port: basePort });
      socket.on('connect', () => {
        assert(socket.id === '1234567890');
        socket.emit('generateId', '');
      });
      socket.on('disconnect', () => app.close().then(done, done));
      socket.on('res', msg => {
        assert(msg === 'hello');
        socket.close();
      });
    });
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

  it('should works ok with uws', done => {
    const app = mm.cluster({
      baseDir: 'apps/socket.io-uws',
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
      test('apps/socket.io-connectionMiddleware', done);
    });

    it('should connectionMiddleware works ok when connection established & disconnected', done => {
      test('apps/socket.io-connectionMiddleware-async', done);
    });

    function test(appConfig, done) {
      const app = mm.cluster({
        baseDir: appConfig,
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
    }
  });

  describe('packetMiddleware', () => {
    it('should packetMiddleware works ok', _done => {
      testPacketMiddleware('socket.io-packetMiddleware', _done);
    });

    it('should packetMiddleware async works ok', _done => {
      testPacketMiddleware('socket.io-packetMiddleware-async', _done);
    });

    function testPacketMiddleware(appName, _done) {
      const app = mm.cluster({
        baseDir: `apps/${appName}`,
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
    }

    it('manual register a event should  be release after packetMiddleware', _done => {
      const app = mm.cluster({
        baseDir: 'apps/socket.io-packetMiddleware',
        workers: 2,
        sticky: true,
      });
      const done = pedding(_done, 2);
      app.ready().then(() => {

        const socket = client('', { port: basePort });
        socket.on('disconnect', () => app.close().then(done, done));
        socket.on('connect', () => {
          socket.emit('anEventNotRegisterInTheRouter', '1');
        });
        socket.on('thisMessageMeansRelease', () => {
          // testunit will failure(timeout) when not get this message
          done();
          socket.close();
        });
      });
    });

    it('manual register an event message and register an other event by app.io.route must be ok too', _done => {
      const app = mm.cluster({
        baseDir: 'apps/socket.io-packetMiddleware',
        workers: 2,
        sticky: true,
      });
      const done = pedding(_done, 3);
      app.ready().then(() => {
        const socket = client('', { port: basePort });
        socket.on('connect', () => {
          socket.emit('chat', '1');
        });
        socket.on('disconnect', () => app.close().then(done, done));
        socket.on('chat', () => done());
        // when the server finished event emit
        socket.on('thisMessageMeansRelease', () => {
          socket.close();
          done();
        });
      });

    });

    it('return without wait next()', done => {
      const app = mm.cluster({
        baseDir: 'apps/socket.io-packetMiddleware-return-async',
        workers: 2,
        sticky: true,
      });

      app.ready().then(() => {
        const socket = client('', { port: basePort });
        socket.on('disconnect', () => app.close().then(done, done));
        socket.on('msg', r => {
          assert(r === 'socket.io-packetMiddleware-return-async');
          socket.close();
        });
        socket.on('connect', () => socket.emit('chat', 'test'));
      });
    });
  });

  describe('session', () => {
    it('with cookie session allowed', done => {
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
            const cookie = res.headers['set-cookie'].join(';');
            const socket = client('', {
              extraHeaders: { cookie },
              port: basePort,
            });
            socket.on('error', err => done(new Error(err)));
            socket.on('connect', () => socket.emit('chat', ''));
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

    it('with external session allowed', done => {
      const app = mm.cluster({
        baseDir: 'apps/socket.io-external-session',
        workers: 2,
        sticky: true,
      });

      app.ready().then(() => {
        const req = request(`http://127.0.0.1:${basePort}`);
        req.get('/home')
          .expect(200)
          .expect('hello', function requestDone(err, res) {
            assert(!err, err);
            const cookie = res.headers['set-cookie'].join(';');
            const socket = client('', {
              extraHeaders: { cookie },
              port: basePort,
            });
            socket.on('error', err => done(new Error(err)));
            socket.on('connect', () => socket.emit('chat', ''));
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
            socket.on('error', err => {
              if (err === 'auth failed!') {
                done();
              } else {
                done(new Error('should auth failed!'));
              }
            });
          });
      });
    });
  });

  describe('error', () => {
    it('Controller error', done => {
      testControllerError('socket.io-controller-error', done);
    });

    it('Controller error async', done => {
      testControllerError('socket.io-controller-error-async', done);
    });

    function testControllerError(appName, _done) {
      const app = mm.cluster({
        baseDir: `apps/${appName}`,
        workers: 2,
        sticky: true,
      });
      const done = pedding(_done, 2);

      app.ready().then(() => {
        const socket = client('', { port: basePort });
        socket.on('disconnect', () => {
          setTimeout(() => {
            app.close()
              .then(() => {
                const errorLog = getErrorLogContent(appName);
                assert(contains(errorLog, 'Controller Disconnect!') === 1);
                assert(contains(errorLog, 'Controller Disconnecting!') === 1);
              })
              .then(done, done);
          }, 1000);
        });
        socket.on('connect', () => socket.emit('chat', ''));
        socket.on('error', e => {
          assert(contains(e, 'Controller Error!') === 1);
          done();
        });
        setTimeout(() => {
          const errorLog = getErrorLogContent(appName);
          assert(contains(errorLog, 'Controller Error!') === 1);
          socket.close();
        }, 500);
      });
    }

    it('connectionMiddleware error', done => {
      testConnectionMiddlewareError('socket.io-connectionMiddleware-error', done);
    });

    it('connectionMiddleware error async', done => {
      testConnectionMiddlewareError('socket.io-connectionMiddleware-error-async', done);
    });

    function testConnectionMiddlewareError(appName, _done) {
      const app = mm.cluster({
        baseDir: `apps/${appName}`,
        workers: 2,
        sticky: true,
      });
      const done = pedding(_done, 2);

      app.ready().then(() => {
        const socket = client('', { port: basePort });
        socket.on('disconnect', () => app.close().then(done, done));
        socket.on('connect', () => socket.emit('chat', ''));
        socket.on('error', e => {
          assert(contains(e, 'connectionMiddleware Error!') === 1);
          done();
        });
        setTimeout(() => {
          const errorLog = getErrorLogContent(appName);
          assert(contains(errorLog, 'connectionMiddleware Error!') === 1);
          done();
        }, 500);
      });
    }

    it('packetMiddleware error', done => {
      testPacketMiddlewareError('socket.io-packetMiddleware-error', done);
    });

    it('packetMiddleware error async', done => {
      testPacketMiddlewareError('socket.io-packetMiddleware-error-async', done);
    });

    function testPacketMiddlewareError(appName, _done) {
      const app = mm.cluster({
        baseDir: `apps/${appName}`,
        workers: 2,
        sticky: true,
      });
      const done = pedding(_done, 2);

      app.ready().then(() => {
        const socket = client('', { port: basePort });
        socket.on('disconnect', () => app.close().then(done, done));
        socket.on('connect', () => socket.emit('chat', ''));
        socket.on('error', e => {
          assert(contains(e, 'packetMiddleware Error!') === 1);
          done();
        });
        setTimeout(() => {
          const errorLog = getErrorLogContent(appName);
          assert(contains(errorLog, 'packetMiddleware Error!') === 1);
          done();
        }, 500);
      });
    }

    it('redis connection error', done => {
      const appName = 'socket.io-test-redis-error';
      const app = mm.cluster({
        baseDir: `apps/${appName}`,
        workers: 2,
        sticky: true,
      });
      app.ready().then(() => {
        setTimeout(() => {
          app.close()
            .then(() => {
              const errorLog = getErrorLogContent(appName);
              assert(contains(errorLog, 'connect ECONNREFUSED 127.0.0.1:6666') > 0);
            })
            .then(done, done);
        }, 300);
      });
    });
  });

  describe('namespace', () => {
    it('should namespace works ok', done => {
      const app = mm.cluster({
        baseDir: 'apps/socket.io-ns',
        workers: 1,
        sticky: false,
      });
      app.ready().then(() => {
        const socket = client('/nstest', { port: basePort });
        socket.on('connect', () => socket.emit('chat', ''));
        socket.on('disconnect', () => app.close().then(done, done));
        socket.on('res', msg => {
          assert(msg === 'hello');
          socket.close();
        });
      });
    });
  });

  describe('ts for egg-socket starting now...', () => {
    before(() => {
      // Add new dynamic compiler to compile from ts to js
      const destPath = path.resolve('./test/fixtures/apps/ts');
      const compilerPath = path.resolve('./node_modules/typescript/bin/tsc');
      compile.execSync(`node ${compilerPath} -p ${destPath}`);
    });

    it('should work with a common socketIO controller', done => {
      const app = mm.cluster({
        baseDir: 'apps/ts/socket.io-common',
        workers: 1,
        sticky: false,
      });
      app.ready().then(() => {
        const socket = client('', { port: basePort });
        let counter = 0;
        socket.on('connect', () => {
          socket.emit('chat', '');
        });
        socket.on('res', () => {
          counter++;
        });
        socket.on('onBefore', () => {
          counter++;
        });
        socket.on('onAfter', () => {
          counter++;
          assert(counter === 3);
          socket.close();
        });
        socket.on('disconnect', () => app.close().then(done, done));
      });
    });

    it('should work with a namespaced socketIO controller', done => {
      const app = mm.cluster({
        baseDir: 'apps/ts/socket.io-common',
        workers: 1,
        sticky: false,
      });
      app.ready().then(() => {
        const socket = client('/ts_of', { port: basePort });
        socket.on('connect', () => {
          socket.emit('chat', '');
        });
        socket.on('disconnect', () => app.close().then(done, done));
        socket.on('res', msg => {
          assert(msg === 'tsHello!');
          socket.close();
        });
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
