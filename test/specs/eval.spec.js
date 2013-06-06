describe('eval.js', function () {
	var isNode = typeof module !== 'undefined' && module.exports;
	var Worker = isNode ? require(__dirname + '/../../lib/Worker.js') : self.Worker;

	it('should eval the given code', function () {
		var wrk = new Worker(isNode ? __dirname + '/../../lib/eval.js' : 'lib/eval.js');

		var result = null;
		var done = false;
		runs(function () {
			wrk.onmessage = function (msg) {
				result = msg.data;
				done = true;
				wrk.terminate();
			};
			wrk.postMessage(isNode ? 'process.send(JSON.stringify("abc"))' : 'self.postMessage("abc")');
		});

		waitsFor(function () {
			return done;
		}, 'should finish', 500);

		runs(function () {
			expect(result).toEqual('abc');
		});
	});
});