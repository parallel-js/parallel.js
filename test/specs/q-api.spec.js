describe('Q-API', function () {
	var isNode = typeof module !== 'undefined' && module.exports;

	function addOne(el) {
		return el + 1;
	}

	function sum(a, b) {
		return a + b;
	}

	if (isNode) {
		var Q = require('q');

		it('should execute .spawn() correctly', function (done) {
			var Parallel = require('../../lib/parallel.js');
			var p = new Parallel([1, 2, 3]);

			Q.when(p.spawn(function (data) {
				return ['something', 'completely', 'else'];
			})).then(function (data) {
				expect(data).toEqual(['something', 'completely', 'else']);
				done();
			});
		});

		it('should .map() correctly', function (done) {
			var Parallel = require('../../lib/parallel.js');
			var p = new Parallel([1, 2, 3]);

			Q.when(p.map(addOne)).then(function (data) {
				expect(data).toEqual([2, 3, 4]);
				done();
			});
		});

		it('should queue map work correctly', function () {
			var Parallel = require('../../lib/parallel.js');
			var p = new Parallel([1, 2, 3], { maxWorkers: 2 });

			Q.when(p.map(addOne)).then(function (data) {
				expect(data).toEqual([2, 3, 4]);
			});
		});

		it('should chain .map() correctly', function (done) {
			var Parallel = require('../../lib/parallel.js');
			var p = new Parallel([1, 2, 3]);

			Q.when(p.map(addOne)).then(function () {
				return p.map(function (el) {
					return el - 1;
				});
			}).then(function (data) {
				expect(data).toEqual([1, 2, 3]);
				done();
			});
		});

		it('should mix .spawn and .map() correctly', function () {
			var Parallel = require('../../lib/parallel.js');
			var p = new Parallel([1, 2, 3]);

			Q.when(p.map(addOne))
			.then(function () {
				return p.spawn(function (data) {
					return data.reduce(sum);
				});
			}).then(function (data) {
				expect(result).toEqual(9);
			});
		});

		it('should execute .reduce() correctly', function (done) {
			var Parallel = require('../../lib/parallel.js');
			var p = new Parallel([1, 2, 3]);

			Q.when(p.reduce(function (data) {
				return data[0] + data[1];
			})).then(function (data) {
				expect(data).toEqual(6);
				done();
			});
		});

		it('should process data returned from .then()', function (done) {
			var Parallel = require('../../lib/parallel.js');
			var p = new Parallel([1, 2, 3]);

			Q.when(p.map(addOne)).then(function (qe) {
				return p.then(function (data) {
					return data.reduce(sum);
				});
			}).then(function (data) {
				expect(data).toEqual(9);
				done();
			});
		});
	}
});