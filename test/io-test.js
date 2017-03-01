'use strict';

const request = require('supertest');
const mm = require('egg-mock');

describe('test/socketio.test.js', () => {
  let app;
  before(done => {
    app = mm.app({
      baseDir: 'apps/socket.io-test',
    });
    app.ready(done);
  });

  after(() => app.close());
  afterEach(mm.restore);

  it('should GET /', () => {
    return request(app.callback())
      .get('/')
      .expect('hi, socket.io')
      .expect(200);
  });
});
