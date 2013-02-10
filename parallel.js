/*
 *	Library: parallel.js
 *	Author: Adam Savitzky
 */
 
var Parallel = (function  () {

	var spawn = (function () {

		var wrap = function (fn) {
			return 'self.onmessage = function (e) { self.postMessage(JSON.stringify((' + fn.toString() + ').apply(self, JSON.parse(e.data)))); }';
		};

		var RemoteRef = function (fn) {
			var str = wrap(fn),
				blob = new Blob([str], { type: 'text/javascript' }),
				url = URL.createObjectURL(blob),
				worker = new Worker(url);

			worker.onmessage = this.onWorkerMsg;

			this.worker = worker;
			this.worker.ref = this;
		};

		RemoteRef.prototype.onWorkerMsg = function (e) {
			this.ref.data = JSON.parse(e.data);
		};

		RemoteRef.prototype.data = undefined;

		RemoteRef.prototype.fetch = function (cb) {
			return this.data ? (cb ? cb(this.data): this.data) : (setTimeout(_.bind(this.fetch, this, cb), 0) && undefined);
		};

		RemoteRef.prototype.terminate = function () {
			this.worker.terminate();
		};

		return function (fn, args) {
			var r = new RemoteRef(fn);
			r.worker.postMessage(JSON.stringify([].concat(args)));

			return r;
		};

	})();

	var mapreduce = (function () {

		var DistributedProcess = function (mapper, reducer, chunks) {
			this.mapper = mapper;
			this.reducer = reducer;
			this.chunks = chunks;
			this.refs = _.map(chunks, function (chunk) {
				return spawn(mapper, [].concat(chunk));
			});
		};

		DistributedProcess.prototype.fetch = function (cb) {
			var results = this.fetchRefs(),
				that = this;

			if (_.isEqual(results, _.without(results, undefined))) {
				return cb ? cb(_.reduce(results, this.reducer)) : _.reduce(results, this.reducer);
			}

			setTimeout(function () {
				that.fetch(cb);
			}, 100);
		};


		DistributedProcess.prototype.fetchRefs = function (cb) {
			return _.map(this.refs, function (ref) {
				return ref.fetch(cb || undefined);
			}, this);
		};

		DistributedProcess.prototype.terminate = function (n) {
			n !== undefined ? this.refs[n].terminate() : _.invoke(this.refs, 'terminate');
		};

		return function (mapper, reducer, chunks, cb) {
			var d = new DistributedProcess(mapper, reducer, chunks);

			d.fetch(cb);

			return d;
		}
	})();

	return {
		mapreduce: mapreduce,
		spawn: spawn
	};

})();