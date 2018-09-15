'use strict';

/**
 * The default `io` config.
 *
 * `init`: This is the same configs in
 * https://github.com/socketio/engine.io/blob/master/README.md#methods-1
 *
 * `namespace`:
 *  i) If you wanna define your own namespace, just write something like:
 *  ```js
 *  namespace: {
    'your_Namespace_Name': {
      connectionMiddleware: [],
      packetMiddleware: [],
    },
 *  ```
 * If you don't want namespace, just use '/' into your namespace config.
 *
 * ii) Create a folder called `middleware`, where to put your
 * connectionMiddlewares and packetMiddlewares.
 */
exports.io = {
  init: {},
  namespace: {
    '/': {
      connectionMiddleware: [],
      packetMiddleware: [],
    },
  },
};
