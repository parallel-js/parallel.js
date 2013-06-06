describe('Performance', function () {
	var isNode = typeof module !== 'undefined' && module.exports;
	var Parallel = isNode ? require('../../lib/parallel.js') : self.Parallel;

	it('.map() should be using multi-threading (could fail on single-core)', function () {
		var slowSquare = function (n) {
			var i = 0;
			while (++i < n * n) { }
			return i;
		};

		var p = new Parallel([10000, 20000, 30000]);
		var p2 = new Parallel([10000, 20000, 30000]);

		var start;
		var time = null;

		runs(function () {
			start = Date.now();

			p.spawn(function (data) {
				for (var i = 0; i < data.length; ++i) {
					var n = data[i];
					var square;
					for (square = 0; square < n * n; ++square) { }
					data[i] = square;
				}
				return data;
			}).then(function (data) {
				time = Date.now() - start;
			});
		});

		waitsFor(function () {
			return time !== null;
		}, "Sequential should finish", 5000);

		var start2;
		var time2 = null;

		runs(function () {
			start2 = Date.now();

			p2.map(slowSquare).then(function (data) {
				time2 = Date.now() - start2;
			});
		});

		waitsFor(function () {
			return time2 !== null;
		}, "Parallel should finish", 5000);

		runs(function () {
			expect(time2).toBeLessThan(time * 0.8);
		});
	});
});