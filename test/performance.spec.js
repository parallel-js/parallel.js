describe('Performance', function () {
	var isNode = typeof module !== 'undefined' && module.exports;
	var cpus = isNode && require('os').cpus().length > 2 ? 2 : 1;

	it('.map() should be using multi-threading (could fail on single-core)', function () {
		var slowSquare = function (n) {
			var i = 0;
			while (++i < n * n) { }
			return i;
		};

		var Thread = require('../lib/thread.js');
		var p = new Thread([1000, 2000, 3000]);
		var p2 = new Thread([1000, 2000, 3000]);

		var start = Date.now();
		var start2 = Date.now();

		var time = null;
		var time2 = null;

		runs(function () {
			p.spawn(function (data) {
				for (var i = 0; i < data.length; ++i) {
					var n = data[i];
					var i = 0;
					while (++i < n * n) { }
					data[i] = i;
				}
				return data;
			}).then(function (data) {
				time = Date.now() - start;
				result = data;
			});

			p2.map(slowSquare).then(function (data) {
				time2 = Date.now() - start2;
				result = data;
			});
		});

		waitsFor(function () {
			return time != null && time2 != null;
		}, "it should finish", 5000);

		runs(function () {
			expect(time2).toBeLessThan(time / cpus);
		});
	});
});