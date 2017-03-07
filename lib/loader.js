'use strict';

const debug = require('debug')('egg-socket.io:lib:loader.js');
const path = require('path');

module.exports = app => {
  let dirs = app.loader.getLoadUnits().map(unit => path.join(unit.path, 'app', 'io', 'middleware'));

  app.io.middlewares = app.io.middlewares || {};
  new app.loader.FileLoader({
    directory: dirs,
    target: app.io.middlewares,
    inject: app,
  }).load();

  debug('[egg-socket.io] app.io.controllers:', app.io.controllers);

  dirs = app.loader.getLoadUnits().map(unit => path.join(unit.path, 'app', 'io', 'controller'));
  app.io.controllers = app.io.controllers || {};
  new app.loader.FileLoader({
    directory: dirs,
    target: app.io.controllers,
    inject: app,
  }).load();
  debug('[egg-socket.io] app.io.middlewares:', app.io.middlewares);
};
