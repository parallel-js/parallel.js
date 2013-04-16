var isNode = module && module.exports;

if (isNode) {
	var Worker = require(__dirname + '/../Worker.js');
}

describe('eval.js', function () {

	it('should eval the given code', function () {
		var wrk = new Worker('eval.js');
		wrk.postMessage('process.send(JSON.stringify("abc"))');

		var result = null;
		var done = false;
		runs(function () {
			wrk.onmessage = function (msg) {
				result = msg.data;
				done = true;
				wrk.terminate();
			};
		});

		waitsFor(function () {
			return done;
		}, 'should finish', 500);

		runs(function () {
			expect(result).toEqual('abc');
		});
	});
});