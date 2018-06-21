'use strict';

const debug = require('debug')('egg-socket.io:lib:loader.js');
const path = require('path');

module.exports = app => {
  let dirs = app.loader.getLoadUnits().map(unit => path.join(unit.path, 'app', 'io', 'middleware'));

  app.io.middleware = app.io.middleware || {};
  new app.loader.FileLoader({
    directory: dirs,
    target: app.io.middleware,
    inject: app,
    typescript: true
  }).load();

  /* istanbul ignore next */
  app.io.__defineGetter__('middlewares', () => {
    app.deprecate('app.io.middlewares has been deprecated, please use app.io.middleware instead!');
    return app.io.middleware;
  });

  debug('[egg-socket.io] app.io.middleware:', app.io.middleware);

  dirs = app.loader.getLoadUnits().map(unit => path.join(unit.path, 'app', 'io', 'controller'));
  app.io.controller = app.io.controller || {};
  app.loader.loadController({
    directory: dirs,
    target: app.io.controller,
  });

  /* istanbul ignore next */
  app.io.__defineGetter__('controllers', () => {
    app.deprecate('app.io.controllers has been deprecated, please use app.io.controller instead!');
    return app.io.controller;
  });
  debug('[egg-socket.io] app.io.controller:', app.io.controller);
};
