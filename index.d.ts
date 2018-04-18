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

import { Socket, Server } from 'socket.io';

declare module 'egg' {
  export interface Application {
    io: Server & Namespace & EggSocketIO;
  }

  export interface Context {
    socket: Socket
  }

  interface Namespace {
    // Forward the event to the Controller
    route(event: string, handler: Function): any
  }

  interface EggSocketIO {
    middleware: CustomMiddleware;
    controller: CustomController;
  }

    /**
   * your own Middleware
   *
   * @example
   * ```bash
   * {
   *    chat: Chat
   * }
   * ```
   */
  interface CustomMiddleware { }

  /**
   * your own Controler
   *
   *```bash
   * {
   *    auth: auth;
   *    filter: filter;
   * }
   * ```
   */
  interface CustomController { }
}
