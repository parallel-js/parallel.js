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

			for (var i = 0; i < this._errCallbacks.length; ++i) {
				this._errCallbacks[i](res);
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
		path: (isNode ? __dirname + '/' : '') + 'eval.js'
	};

	function Parallel(data, options) {
		this.data = data;
		this.options = extend(defaults, options);
		this.operation = new Operation();
		this.operation.resolve(null, this.data);
	}

	Parallel.getWorkerSource = function (cb) {
		if (isNode) {
			return 'process.on("message", function(e) {process.send(JSON.stringify((' + cb.toString() + ')(JSON.parse(e).data)))})';
		} else {
			return 'self.onmessage = function(e) {self.postMessage((' + cb.toString() + ')(e.data))}';
		}
	};

	Parallel.prototype.spawn = function (cb) {
		var that = this;
		var newOp = new Operation();
		this.operation.then(function () {
			var wrk = new Worker(that.options.path);
			wrk.postMessage(Parallel.getWorkerSource(cb));
			wrk.postMessage(that.data);
			wrk.onmessage = function (msg) {
				wrk.terminate();
				that.data = msg.data;
				newOp.resolve(null, that.data);
			};
		});
		this.operation = newOp;
		return this;
	};

	Parallel.prototype.map = function (cb, opts) {
		opts = extend({ maxWorkers: 4 }, opts);
		if (!this.data.length) {
			return this.spawn(cb);
		}

		function spawnWorker(i) {
			var wrk = new Worker(that.options.path);
			wrk.postMessage(Parallel.getWorkerSource(cb));
			wrk.postMessage(that.data[i]);
			wrk.onmessage = function (msg) {
				wrk.terminate();
				that.data[i] = msg.data;
				done();
			};
		}

		var that = this;
		var newOp = new Operation();
		var startedOps = 0;
		var doneOps = 0;
		function done() {
			if (++doneOps === that.data.length) {
				newOp.resolve(null, that.data);
			} else if (startedOps < that.data.length) {
				spawnWorker(++startedOps);
			}
		}

		this.operation.then(function () {
			for (; startedOps - doneOps < opts.maxWorkers && startedOps < that.data.length; ++startedOps) {
				spawnWorker(startedOps);
			}
		});
		this.operation = newOp;
		return this;
	};

	Parallel.prototype.then = function (cb, errCb) {
		var that = this;
		var newOp = new Operation();
		this.operation.then(function () {
			that.data = cb(that.data);
			newOp.resolve(null, that.data);
		}, errCb);
		this.operation = newOp;
		return this;
	};

	if (isNode) {
		module.exports = Parallel;
	} else {
		self.Parallel = Parallel;
	}
})();