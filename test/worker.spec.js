var isNode = module && module.exports;

if (isNode) {
	var Worker = require(__dirname + '/../lib/Worker.js');
}

describe('WebWorker-API', function () {

	it('should define the used API', function () {
		expect(Worker).toEqual(jasmine.any(Function));
		var wrk = new Worker(__dirname + '/../lib/eval.js');
		expect(wrk.postMessage).toEqual(jasmine.any(Function));
		expect(wrk.terminate).toEqual(jasmine.any(Function));
		wrk.terminate();
	});

	if (isNode) {
		it('should terminate correctly', function () {
			var wrk = new Worker(__dirname + '/../lib/eval.js');

			var done = false;
			runs(function () {
				wrk.process.on('exit', function () {
					done = true;
				});
				wrk.terminate();
			});

			waitsFor(function () {
				return done;
			}, 'terminating correctly', 500);
		});
	}
});