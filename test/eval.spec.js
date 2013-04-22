var isNode = module && module.exports;

if (isNode) {
	var Worker = require(__dirname + '/../lib/Worker.js');
}

describe('eval.js', function () {

	it('should eval the given code', function () {
		var wrk = new Worker(__dirname + '/../lib/eval.js');

		var result = null;
		var done = false;
		runs(function () {
			wrk.onmessage = function (msg) {
				result = msg.data;
				done = true;
				wrk.terminate();
			};
			wrk.postMessage('process.send(JSON.stringify("abc"))');
		});

		waitsFor(function () {
			return done;
		}, 'should finish', 500);

		runs(function () {
			expect(result).toEqual('abc');
		});
	});
});