(function () {
	var isNode = module !== undefined && module.exports;
	var setImmediate = setImmediate || function (cb) {
		setTimeout(cb, 0);
	};

	function extend(from, to) {
		if (!to) to = {};
		for (var i in defaults) {
			if (to[i] === undefined) to[i] = from[i];
		}
		return to;
	}

	function Operation() {
		this._callbacks = [];
		this._errCallbacks = [];

		this._resolved = 0;
		this._result = null;
	};

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
		ie10shim: !isNode
	};

	function Parallel(data, options) {
		this.data = data;
		this.options = extend(defaults, options);
		this.operation = new Operation();
		this.operation.resolve(null, this.data);
	}

	Parallel.prototype.spawn = function (cb) {
		var that = this;
		var newOp = new Operation();
		this.operation.then(function () {
			that.data = cb(that.data);
			newOp.resolve(null, that.data);
		});
		this.operation = newOp;
		return this;
	};

	Parallel.prototype.map = function (cb) {
		var that = this;
		var newOp = new Operation();
		this.operation.then(function () {
			for (var i = 0; i < that.data.length; ++i) {
				that.data[i] = cb(that.data[i]);
			}
			newOp.resolve(null, that.data);
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