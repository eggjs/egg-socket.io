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

import { Socket, Server as SocketServer, Namespace as SocketNameSpace } from 'socket.io';

declare module 'egg' {
  export interface Application {
    io: EggIOServer & EggSocketNameSpace & EggSocketIO;
  }

  export interface Context {
    socket: Socket
  }
  interface EggSocketNameSpace extends SocketNameSpace {
    // Forward the event to the Controller
    route(event: string, handler: Function): any
  }

  // Because SocketIO's Server's of's interface
  // doesn't have 'route'. So we must rewrite it
  interface EggIOServer extends SocketServer {
    of(nsp: string): EggSocketNameSpace;
  }
  interface EggSocketIO {
    middleware: CustomMiddleware;
    controller: CustomController;
  }

  /**
 * your own Middleware
 *
 * @example
 *```bash
 * {
 *    auth: auth;
 *    filter: filter;
 * }
 * ```
 */
  interface CustomMiddleware { }

  /**
   * your own Controler
   * ```bash
   * {
   *    chat: Chat
   * }
   * ```
   */
  interface CustomController { }
}
