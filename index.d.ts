/**
 * Usage: import this module to local workspace and declare middleware & controller in app/io/.../*.ts
 * @example
 * ```ts
 * // app/plugin.d.ts
 * import 'egg-socket.io'
 *
 * // app/io/controller/index.ts
 * declare module 'egg' {
 *   interface CustomMiddleware {
 *     IndexController: YOUR_CLASS_NAME;
 *   }
 * }
 * ```
 */

import * as SocketIO from 'socket.io';

declare module 'egg' {
  export interface Application {
    io: SocketIO.Server & EggSocketIO;
  }
  interface EggSocketIO {
    middleware: CustomMiddleware;
    controller: CustomController;
  }

  /** declare custom middlerwares (connectionMiddleware & packetMiddlerware) in app/io */
  interface CustomMiddleware { }
  /** declare custom controllers in app/io */
  interface CustomController { }
}
