(function () {
	var isNode = typeof module !== 'undefined' && module.exports;
	var setImmediate = setImmediate || function (cb) {
		setTimeout(cb, 0);
	};
	if (isNode) {
		var Worker = require('./Worker.js');
	}

	function extend(from, to) {
		if (!to) to = {};
		for (var i in from) {
			if (to[i] === undefined) to[i] = from[i];
		}
		return to;
	}

	function Operation() {
		this._callbacks = [];
		this._errCallbacks = [];

		this._resolved = 0;
		this._result = null;
	}

	Operation.prototype.resolve = function (err, res) {
		if (!err) {
			this._resolved = 1;
			this._result = res;

			for (var i = 0; i < this._callbacks.length; ++i) {
				this._callbacks[i](res);
			}
		} else {
			this._resolved = 2;
			this._result = err;

			for (var iE = 0; iE < this._errCallbacks.length; ++iE) {
				this._errCallbacks[iE](res);
			}
		}

		this._callbacks = [];
		this._errCallbacks = [];
	};

	Operation.prototype.then = function (cb, errCb) {
		if (this._resolved === 1) { // result
			if (cb) {
				cb(this._result);
			}

			return;
		} else if (this._resolved === 2) { // error
			if (errCb) {
				errCb(this._result);
			}
			return;
		}

		if (cb) {
			this._callbacks[this._callbacks.length] = cb;
		}

		if (errCb) {
			this._errCallbacks[this._errCallbacks.length] = errCb;
		}
		return this;
	};

	var defaults = {
		ie10shim: !isNode,
		path: (isNode ? __dirname + '/' : '') + 'eval.js',
		maxWorkers: isNode ? require('os').cpus().length : 4
	};

	function Thread(data, options) {
		this.data = data;
		this.options = extend(defaults, options);
		this.operation = new Operation();
		this.operation.resolve(null, this.data);
	}

	Thread.getWorkerSource = function (cb) {
		if (isNode) {
			return 'process.on("message", function(e) {process.send(JSON.stringify((' + cb.toString() + ')(JSON.parse(e).data)))})';
		} else {
			return 'self.onmessage = function(e) {self.postMessage((' + cb.toString() + ')(e.data))}';
		}
	};

	Thread.prototype._spawnWorker = function (cb) {
		var wrk;
		if (isNode) {
			wrk = new Worker(this.options.path);
			wrk.postMessage(Thread.getWorkerSource(cb));
		} else {
			try {
				var blob = new Blob([Thread.getWorkerSource(cb)], { type: 'text/javascript' });
				var url = URL.createObjectURL(blob);

				wrk = new Worker(url);
			} catch (e) {
				if (this.options.ie10shim) { // blob/url unsupported, cross-origin error
					worker = new Worker(this.options.path);
					worker.postMessage(str);
				} else {
					throw e;
				}
			}
		}

		return wrk;
	};

	Thread.prototype.spawn = function (cb) {
		var that = this;
		var newOp = new Operation();
		this.operation.then(function () {
			var wrk = that._spawnWorker(cb);
			wrk.onmessage = function (msg) {
				wrk.terminate();
				that.data = msg.data;
				newOp.resolve(null, that.data);
			};
			wrk.postMessage(that.data);
		});
		this.operation = newOp;
		return this;
	};

	Thread.prototype._spawnMapWorker = function (i, cb, done) {
		var that = this;
		var wrk = that._spawnWorker(cb);
		wrk.onmessage = function (msg) {
			wrk.terminate();
			that.data[i] = msg.data;
			done();
		};
		wrk.postMessage(that.data[i]);
	};

	Thread.prototype.map = function (cb) {
		if (!this.data.length) {
			return this.spawn(cb);
		}

		var that = this;
		var startedOps = 0;
		var doneOps = 0;
		function done() {
			if (++doneOps === that.data.length) {
				newOp.resolve(null, that.data);
			} else if (startedOps < that.data.length) {
				that._spawnMapWorker(startedOps++, cb, done);
			}
		}

		var newOp = new Operation();
		this.operation.then(function () {
			for (; startedOps - doneOps < that.options.maxWorkers && startedOps < that.data.length; ++startedOps) {
				that._spawnMapWorker(startedOps, cb, done);
			}
		});
		this.operation = newOp;
		return this;
	};

	Thread.prototype._spawnReduceWorker = function (data, cb, done) {
		var that = this;
		var wrk = that._spawnWorker(cb);
		wrk.onmessage = function (msg) {
			wrk.terminate();
			that.data[that.data.length] = msg.data;
			done();
		};
		wrk.postMessage(data);
	};

	Thread.prototype.reduce = function (cb) {
		if (!this.data.length) {
			throw new Error('Can\'t reduce non-array data');
		}

		var that = this;
		function done(data) {
			if (that.data.length === 1) {
				that.data = that.data[0];
				newOp.resolve(null, that.data);
			} else {
				that._spawnReduceWorker([that.data[0], that.data[1]], cb, done);
				that.data.splice(0, 2);
			}
		}

		var newOp = new Operation();
		this.operation.then(function () {
			if (that.data.length === 1) {
				newOp.resolve(null, that.data[0]);
			} else {
				for (var i = 0; i < that.options.maxWorkers && i < Math.floor(that.data.length / 2); ++i) {
					that._spawnReduceWorker([that.data[i * 2], that.data[i * 2 + 1]], cb, done);
				}

				that.data.splice(0, i * 2);
			}
		});
		this.operation = newOp;
		return this;
	};

	Thread.prototype.then = function (cb, errCb) {
		var that = this;
		var newOp = new Operation();
		this.operation.then(function () {
			var retData = cb(that.data);
			if (retData !== undefined) {
				that.data = retData;
			}
			newOp.resolve(null, that.data);
		}, errCb);
		this.operation = newOp;
		return this;
	};

	if (isNode) {
		module.exports = Thread;
	} else {
		self.Thread = Thread;
	}
})();