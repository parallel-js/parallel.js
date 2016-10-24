/* eslint global-require: 0, import/no-dynamic-require: 0 */
// @flow
const isNode = !(typeof window !== 'undefined' && this === window);
const Worker = isNode ? require(`${__dirname}/Worker.js`) : self.Worker;
const URL = typeof self !== 'undefined' ? (self.URL ? self.URL : self.webkitURL) : null;
const _supports: boolean = !!(isNode || self.Worker); // node always supports parallel


function Operation() {
  this._callbacks = [];
  this._errCallbacks = [];

  this._resolved = 0;
  this._result = null;
}

Operation.prototype.resolve = function resolve(err, res) {
  if (!err) {
    this._resolved = 1;
    this._result = res;

    for (let i = 0; i < this._callbacks.length; i++) {
      this._callbacks[i](res);
    }
  } else {
    this._resolved = 2;
    this._result = err;
  }

  this._callbacks = [];
  this._errCallbacks = [];
};

// @TODO: Use native promises
Operation.prototype.then = function then(cb, errCb) {
  if (this._resolved === 1) { // result
    if (cb) {
      cb(this._result);
    }

    return this;
  } else if (this._resolved === 2) { // error
    if (errCb) {
      errCb(this._result);
    }
    return this;
  }

  if (cb) {
    this._callbacks[this._callbacks.length] = cb;
  }

  if (errCb) {
    this._errCallbacks[this._errCallbacks.length] = errCb;
  }

  return this;
};

const defaults = {
  evalPath: isNode ? `${__dirname}/eval.js` : null,
  maxWorkers: isNode ? require('os').cpus().length : (navigator.hardwareConcurrency || 4),
  synchronous: true,
  env: {},
  envNamespace: 'env'
};

function Parallel(data: Object, options: Object) {
  this.data = data;
  this.options = Object.assign({}, defaults, options);
  this.operation = new Operation();
  this.operation.resolve(null, this.data);
  this.requiredScripts = [];
  this.requiredFunctions = [];
}

// static method
Parallel.isSupported = function isSupported() { return _supports; };

Parallel.prototype.getWorkerSource = function getWorkerSource(cb, env) {
  let preStr = '';
  let i = 0;

  if (!isNode && this.requiredScripts.length !== 0) {
    preStr += `importScripts("${this.requiredScripts.join('","')}");\r\n`;
  }

  for (i = 0; i < this.requiredFunctions.length; i++) {
    if (this.requiredFunctions[i].name) {
      preStr += `var ${this.requiredFunctions[i].name} = ${this.requiredFunctions[i].fn.toString()};`;
    } else {
      preStr += this.requiredFunctions[i].fn.toString();
    }
  }

  env = JSON.stringify(env || {});

  const ns = this.options.envNamespace;

  return isNode
          ? `${preStr}process.on("message", function(e) {global.${ns} = ${env};process.send(JSON.stringify((${cb.toString()})(JSON.parse(e).data)))})`
          : `${preStr}self.onmessage = function(e) {var global = {}; global.${ns} = ${env};self.postMessage((${cb.toString()})(e.data))}`;
};

Parallel.prototype.require = function require(...args) {
  // @TODO: Use .map instead of .forEach
  args.forEach(arg => {
    switch (typeof arg) {
      case 'string':
        this.requiredScripts.push(arg);
        break;
      case 'function':
        this.requiredFunctions.push({ fn: arg });
        break;
      case 'object':
        this.requiredFunctions.push(arg);
        break;
      default:
        throw new Error('Only strings, functions, and objects can be required');
    }
  });

  return this;
};

Parallel.prototype._spawnWorker = function _spawnWorker(cb, env) {
  let wrk;
  const src = this.getWorkerSource(cb, env);
  if (isNode) {
    wrk = new Worker(this.options.evalPath);
    wrk.postMessage(src);
  } else {
    if (Worker === undefined) {
      return undefined;
    }

    try {
      if (this.requiredScripts.length !== 0) {
        if (this.options.evalPath !== null) {
          wrk = new Worker(this.options.evalPath);
          wrk.postMessage(src);
        } else {
          throw new Error('Can\'t use required scripts without eval.js!');
        }
      } else if (!URL) {
        throw new Error('Can\'t create a blob URL in this browser!');
      } else {
        const blob = new Blob([src], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);

        wrk = new Worker(url);
      }
    } catch (e) {
      if (this.options.evalPath !== null) { // blob/url unsupported, cross-origin error
        wrk = new Worker(this.options.evalPath);
        wrk.postMessage(src);
      } else {
        throw e;
      }
    }
  }

  return wrk;
};

Parallel.prototype.spawn = function spawn(cb, env) {
  const that = this;
  const newOp = new Operation();

  env = Object.assign({}, this.options.env, env || {});

  this.operation.then(() => {
    const wrk = that._spawnWorker(cb, env);
    if (wrk !== undefined) {
      wrk.onmessage = function onmessage(msg) {
        wrk.terminate();
        that.data = msg.data;
        newOp.resolve(null, that.data);
      };
      wrk.onerror = function onerror(e) {
        wrk.terminate();
        newOp.resolve(e, null);
      };
      wrk.postMessage(that.data);
    } else if (that.options.synchronous) {
      setImmediate(() => {
        try {
          that.data = cb(that.data);
          newOp.resolve(null, that.data);
        } catch (e) {
          newOp.resolve(e, null);
        }
      });
    } else {
      throw new Error('Workers do not exist and synchronous operation not allowed!');
    }
  });
  this.operation = newOp;
  return this;
};

Parallel.prototype._spawnMapWorker = function _spawnMapWorker(i, cb, done, env, wrk) {
  const that = this;

  if (!wrk) wrk = that._spawnWorker(cb, env);

  if (wrk !== undefined) {
    wrk.onmessage = function (msg) {
      that.data[i] = msg.data;
      done(null, wrk);
    };
    wrk.onerror = function (e) {
      wrk.terminate();
      done(e);
    };
    wrk.postMessage(that.data[i]);
  } else if (that.options.synchronous) {
    setImmediate(() => {
      that.data[i] = cb(that.data[i]);
      done();
    });
  } else {
    throw new Error('Workers do not exist and synchronous operation not allowed!');
  }
};

Parallel.prototype.map = function map(cb, env = {}) {
  env = Object.assign({}, this.options.env, env);

  if (!this.data.length) {
    return this.spawn(cb, env);
  }

  const that = this;
  let startedOps = 0;
  let doneOps = 0;
  function done(err, wrk) {
    if (err) {
      newOp.resolve(err, null);
    } else if (++doneOps === that.data.length) {
      newOp.resolve(null, that.data);
      if (wrk) wrk.terminate();
    } else if (startedOps < that.data.length) {
      that._spawnMapWorker(startedOps++, cb, done, env, wrk);
    } else if (wrk) wrk.terminate();
  }

  let newOp = new Operation();

  this.operation.then(() => {
    for (; startedOps - doneOps < that.options.maxWorkers && startedOps < that.data.length; ++startedOps) {
      that._spawnMapWorker(startedOps, cb, done, env);
    }
  }, (err) => {
    newOp.resolve(err, null);
  });

  this.operation = newOp;

  return this;
};

Parallel.prototype._spawnReduceWorker = function _spawnReduceWorker(data, cb, done, env, wrk) {
  const that = this;
  if (!wrk) wrk = that._spawnWorker(cb, env);

  if (wrk !== undefined) {
    wrk.onmessage = function onmessage(msg) {
      that.data[that.data.length] = msg.data;
      done(null, wrk);
    };
    wrk.onerror = function onerror(e) {
      wrk.terminate();
      done(e, null);
    };
    wrk.postMessage(data);
  } else if (that.options.synchronous) {
    setImmediate(() => {
      that.data[that.data.length] = cb(data);
      done();
    });
  } else {
    throw new Error('Workers do not exist and synchronous operation not allowed!');
  }
};

Parallel.prototype.reduce = function reduce(cb, env) {
  env = Object.assign({}, this.options.env, env || {});

  if (!this.data.length) {
    throw new Error('Can\'t reduce non-array data');
  }

  let runningWorkers = 0;
  const that = this;
  function done(err, wrk) {
    runningWorkers--;
    if (err) {
      newOp.resolve(err, null);
    } else if (that.data.length === 1 && runningWorkers === 0) {
      that.data = that.data[0];
      newOp.resolve(null, that.data);
      if (wrk) wrk.terminate();
    } else if (that.data.length > 1) {
      ++runningWorkers;
      that._spawnReduceWorker([that.data[0], that.data[1]], cb, done, env, wrk);
      that.data.splice(0, 2);
    } else if (wrk) wrk.terminate();
  }

  let newOp = new Operation();
  this.operation.then(() => {
    if (that.data.length === 1) {
      newOp.resolve(null, that.data[0]);
    } else {
      for (var i = 0; i < that.options.maxWorkers && i < Math.floor(that.data.length / 2); ++i) {
        ++runningWorkers;
        that._spawnReduceWorker([that.data[i * 2], that.data[i * 2 + 1]], cb, done, env);
      }

      that.data.splice(0, i * 2);
    }
  });
  this.operation = newOp;
  return this;
};

Parallel.prototype.then = function then(cb, errCb) {
  const that = this;
  const newOp = new Operation();
  errCb = typeof errCb === 'function' ? errCb : function () {};

  this.operation.then(() => {
    let retData;

    try {
      if (cb) {
        retData = cb(that.data);
        if (retData !== undefined) {
          that.data = retData;
        }
      }
      newOp.resolve(null, that.data);
    } catch (e) {
      if (errCb) {
        retData = errCb(e);
        if (retData !== undefined) {
          that.data = retData;
        }

        newOp.resolve(null, that.data);
      } else {
        newOp.resolve(null, e);
      }
    }
  }, (err) => {
    if (errCb) {
      const retData = errCb(err);
      if (retData !== undefined) {
        that.data = retData;
      }

      newOp.resolve(null, that.data);
    } else {
      newOp.resolve(null, err);
    }
  });
  this.operation = newOp;
  return this;
};

if (isCommonJS) {
  module.exports = Parallel;
} else {
  self.Parallel = Parallel;
}
