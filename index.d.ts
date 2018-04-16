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
    io: Serverr & Namespace & EggSocketIO;
  }

  export interface Context {
    socket: Socket
  }

  interface Namespace {
    // 事件转发
    route(event: string, handler: Function): any
  }

  interface EggSocketIO {
    middleware: CustomMiddleware;
    controller: CustomController;
  }

  // 自有项目编写的 Middleware
  interface CustomMiddleware { }
  // 自有项目编写的 Controler
  interface CustomController { }
}
