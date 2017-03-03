'use strict';

console.log('start debug');

const path = require('path');
const fs = require('fs');

const p = path.join(__dirname, 'node_modules', 'egg-cluster', 'lib', 'master.js');

const r = `
'use strict';

const util = require('util');
const path = require('path');
const cluster = require('cluster');
const EventEmitter = require('events');
const childprocess = require('child_process');
const cfork = require('cfork');
const ready = require('get-ready');
const debug = require('debug')('egg-cluster');
const detectPort = require('detect-port');
const ConsoleLogger = require('egg-logger').EggConsoleLogger;

const parseOptions = require('./utils/options');
const Messenger = require('./utils/messenger');

const agentWorkerFile = path.join(__dirname, 'agent_worker.js');
const appWorkerFile = path.join(__dirname, 'app_worker.js');

class Master extends EventEmitter {

  constructor(options) {
    super();
    this.options = parseOptions(options);
    this.messenger = new Messenger(this);

    ready.mixin(this);

    this.isProduction = isProduction();
    this.isDebug = isDebug();

    // app started or not
    this.isStarted = false;
    this.logger = new ConsoleLogger({ level: 'INFO' });

    // get the real framework info
    const frameworkPath = this.options.framework;
    const frameworkPkg = require(path.join(frameworkPath, 'package.json'));

    const startTime = Date.now();

    this.ready(() => {
      this.isStarted = true;
      const stickyMsg = this.options.sticky ? ' with STICKY MODE!' : '';
      this.logger.info('[master] %s started on %s://127.0.0.1:%s (%sms)%s',
        frameworkPkg.name, this.options.https ? 'https' : 'http', this.options.port, Date.now() - startTime, stickyMsg);

      const action = 'egg-ready';
      this.messenger.send({ action, to: 'parent' });
      this.messenger.send({ action, to: 'app', data: this.options });
      this.messenger.send({ action, to: 'agent', data: this.options });
    });

    this.on('agent-exit', this.onAgentExit.bind(this));
    this.on('agent-start', this.onAgentStart.bind(this));
    this.on('app-exit', this.onAppExit.bind(this));
    this.on('app-start', this.onAppStart.bind(this));
    this.on('reload-worker', this.onReload.bind(this));

    // fork app workers after agent started
    this.once('agent-start', this.forkAppWorkers.bind(this));

    this.onExit();

    detectPort((err, port) => {
      /* istanbul ignore if */
      if (err) {
        err.name = 'ClusterPortConflictError';
        err.message = '[master] try get free port error, ' + err.message;
        this.logger.error(err);
        return;
      }
      this.options.clusterPort = port;
      this.forkAgentWorker();
    });
  }

  startMasterSocketServer(cb) {
    // Create the outside facing server listening on our port.
    require('net').createServer({ pauseOnConnect: true }, connection => {
      // We received a connection and need to pass it to the appropriate
      // worker. Get the worker for this connection's source IP and pass
      // it the connection.
      const worker = this.stickyWorker(connection.remoteAddress);
      worker.send('sticky-session:connection', connection);
    }).listen(this.options.port, cb);
  }

  stickyWorker(ip) {
    const workerNumbers = this.options.workers;
    const ws = Array.from(this.workers.keys());

    let s = '';
    for (let i = 0; i < ip.length; i++) {
      if (!isNaN(ip[i])) {
        s += ip[i];
      }
    }
    s = Number(s);
    const pid = ws[s % workerNumbers];

    console.log('workerNumbers:', workerNumbers);
    console.log('ws:', ws);
    console.log('s:', s);
    console.log('pid:', pid);
    console.log('s % workerNumbers:', s % workerNumbers);

    return this.workers.get(pid);
  }

  forkAgentWorker() {
    this.agentStartTime = Date.now();

    const args = [ JSON.stringify(this.options) ];
    // debug port:
    // agent_worker: 5856
    // master: 5857
    // app_worker0: 5858
    // app_worker1: 5859
    // ...
    const opt = { execArgv: process.execArgv.concat([ '--debug-port=5856' ]) };
    const agentWorker = this.agentWorker = childprocess.fork(agentWorkerFile, args, opt);
    this.logger.info('[master] Agent Worker:%s start with %j', agentWorker.pid, args);

    // forwarding agent' message to messenger
    agentWorker.on('message', msg => {
      if (typeof msg === 'string') msg = { action: msg, data: msg };
      msg.from = 'agent';
      this.messenger.send(msg);
    });
    agentWorker.on('error', err => {
      err.name = 'AgentWorkerError';
      this.logger.error(err);
    });
    // agent exit message
    agentWorker.once('exit', (code, signal) => {
      this.messenger.send({
        action: 'agent-exit',
        data: { code, signal },
        to: 'master',
        from: 'agent',
      });
    });
  }


  forkAppWorkers() {
    this.appStartTime = Date.now();
    this.isAllAppWorkerStarted = false;
    this.startSuccessCount = 0;

    this.workers = new Map();

    const args = [ JSON.stringify(this.options) ];
    debug('Start appWorker with args %j', args);
    cfork({
      exec: appWorkerFile,
      args,
      silent: false,
      count: this.options.workers,
      // don't refork in local env
      refork: this.isProduction,
    });

    cluster.on('fork', worker => {
      this.workers.set(worker.process.pid, worker);
      worker.on('message', msg => {
        if (typeof msg === 'string') msg = { action: msg, data: msg };
        msg.from = 'app';
        this.messenger.send(msg);
      });
      this.logger.info('[master] App Worker#%s:%s start, state: %s, current workers: %j',
        worker.id, worker.process.pid, worker.state, Object.keys(cluster.workers));
    });
    cluster.on('disconnect', worker => {
      this.logger.info('[master] App Worker#%s:%s disconnect, suicide: %s, state: %s, current workers: %j',
        worker.id, worker.process.pid, worker.suicide, worker.state, Object.keys(cluster.workers));
    });
    cluster.on('exit', (worker, code, signal) => {
      this.messenger.send({
        action: 'app-exit',
        data: { workerPid: worker.process.pid, code, signal },
        to: 'master',
        from: 'app',
      });
    });
    cluster.on('listening', (worker, address) => {
      this.messenger.send({
        action: 'app-start',
        data: { workerPid: worker.process.pid, address },
        to: 'master',
        from: 'app',
      });
    });
  }

  /**
   * close agent worker, App Worker will closed by cluster
   *
   * https://www.exratione.com/2013/05/die-child-process-die/
   * make sure Agent Worker exit before master exit
   */
  killAgentWorker() {
    if (this.agentWorker) {
      debug('kill agent worker with signal SIGTERM');
      this.agentWorker.removeAllListeners();
      this.agentWorker.kill('SIGTERM');
    }
  }

  /**
   * Agent Worker exit handler
   * Will exit during startup, and refork during running.
   * @param {Object} data
   *  - {Number} code   exit code
   *  - {String} signal received signal
   */
  onAgentExit(data) {
    this.messenger.send({ action: 'egg-pids', to: 'app', data: [] });

    const err = new Error(util.format('[master] Agent Worker %s died (code: %s, signal: %s)',
      this.agentWorker.pid, data.code, data.signal));
    err.name = 'AgentWorkerDiedError';
    this.logger.error(err);

    // remove all listeners to avoid memory leak
    this.agentWorker.removeAllListeners();
    this.agentWorker = null;

    if (this.isStarted) {
      setTimeout(() => {
        this.logger.info('[master] Agent Worker restarting');
        this.forkAgentWorker();
      }, 1000);
      this.messenger.send({
        action: 'agent-worker-died',
        to: 'parent',
      });
    } else {
      this.logger.error('[master] agent start fail, exit now');
      process.exit(1);
    }
  }

  onAgentStart() {
    this.messenger.send({ action: 'egg-pids', to: 'app', data: [ this.agentWorker.pid ] });
    this.messenger.send({ action: 'agent-start', to: 'app' });
    this.logger.info('[master] Agent Worker started (%sms)',
      Date.now() - this.agentStartTime);
  }

  /**
   * App Worker exit handler
   * @param {Object} data
   *  - {String} workerPid - worker id
   *  - {Number} code - exit code
   *  - {String} signal - received signal
   */
  onAppExit(data) {
    const worker = this.workers.get(data.workerPid);

    if (!worker.isDevReload) {
      const signal = data.code;
      const message = util.format(
        '[master] App Worker#%s:%s died (code: %s, signal: %s, suicide: %s, state: %s), current workers: %j',
        worker.id, worker.process.pid, worker.process.exitCode, signal,
        worker.suicide, worker.state,
        Object.keys(cluster.workers)
      );
      const err = new Error(message);
      err.name = 'AppWorkerDiedError';
      this.logger.error(err);
    }

    // remove all listeners to avoid memory leak
    worker.removeAllListeners();
    this.workers.delete(data.workerPid);
    // send message to agent with alive workers
    this.messenger.send({ action: 'egg-pids', to: 'agent', data: getListeningWorker(this.workers) });

    if (this.isAllAppWorkerStarted) {
      // cfork will only refork at production mode
      this.messenger.send({
        action: 'app-worker-died',
        to: 'parent',
      });

      if (this.isDebug && !worker.isDevReload) {
        // exit if died during debug
        this.logger.error('[master] kill by debugger, exit now');
        process.exit(0);
      }
    } else {
      // exit if died during startup
      this.logger.error('[master] worker start fail, exit now');
      process.exit(1);
    }
  }

  /**
   * after app worker
   * @param {Object} data
   *  - {String} workerPid - worker id
   *  - {Object} address - server address
   */
  onAppStart(data) {
    const worker = this.workers.get(data.workerPid);
    const address = data.address;

    // ignore unspecified port
    if (!this.options.sticky && (String(address.port) !== String(this.options.port))) {
      return;
    }

    // send message to agent with alive workers
    this.messenger.send({ action: 'egg-pids', to: 'agent', data: getListeningWorker(this.workers) });

    this.startSuccessCount++;

    const remain = this.isAllAppWorkerStarted ? 0 : this.options.workers - this.startSuccessCount;
    this.logger.warn('[master] App Worker#%s:%s started at %s, remain %s (%sms)',
      worker.id, data.workerPid, address.port, remain, Date.now() - this.appStartTime);

    if (this.isAllAppWorkerStarted || this.startSuccessCount < this.options.workers) {
      return;
    }

    this.isAllAppWorkerStarted = true;

    if (this.options.sticky) {
      this.startMasterSocketServer(err => {
        if (err) return this.ready(err);
        this.ready(true);
      });
    } else {
      this.ready(true);
    }
  }

  /**
   * master exit handler
   */
  onExit() {
    // kill agent worker
    process.once('exit', code => {
      // istanbul can't cover here
      // https://github.com/gotwarlost/istanbul/issues/567
      this.killAgentWorker();
      this.logger.info('[master] exit with code: %s', code);
    });

    // https://nodejs.org/api/process.html#process_signal_events
    // https://en.wikipedia.org/wiki/Unix_signal
    // kill(2) Ctrl-C
    process.once('SIGINT', receiveSig.bind(null, 'SIGINT'));
    // kill(3) Ctrl-\
    process.once('SIGQUIT', receiveSig.bind(null, 'SIGQUIT'));
    // kill(15) default
    process.once('SIGTERM', receiveSig.bind(null, 'SIGTERM'));

    function receiveSig(sig) {
      debug('receive signal %s, exit with code 0, pid %s', sig, process.pid);
      process.exit(0);
    }
  }

  /**
   * reload workers, for develop purpose
   */
  onReload() {
    this.logger.info('[master] reload workers...');
    for (const id in cluster.workers) {
      const worker = cluster.workers[id];
      worker.isDevReload = true;
    }
    require('cluster-reload')(this.options.workers);
  }
}

module.exports = Master;

function getListeningWorker(workers) {
  const keys = [];
  for (const id of workers.keys()) {
    if (workers.get(id).state === 'listening') {
      keys.push(id);
    }
  }
  return keys;
}

function isProduction() {
  const serverEnv = process.env.EGG_SERVER_ENV;
  if (serverEnv) {
    return serverEnv !== 'local' && serverEnv !== 'unittest';
  }
  return process.env.NODE_ENV === 'production';
}

function isDebug() {
  return process.execArgv.indexOf('--debug') !== -1 || typeof v8debug !== 'undefined';
}

`;

fs.writeFileSync(p, r);
