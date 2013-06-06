describe('Q-API', function () {
	var isNode = typeof module !== 'undefined' && module.exports;

	if (isNode) {
		var Q = require('q');

		it('should execute .spawn() correctly', function () {
			var Parallel = require('../../lib/parallel.js');
			var p = new Parallel([1, 2, 3]);

			var done = false;
			var result = null;

			runs(function () {
				Q.when(p.spawn(function (data) {
					return ['something', 'completly', 'else'];
				})).then(function (data) {
					result = data;
					done = true;
				});
			});

			waitsFor(function () {
				return done;
			}, "it should finish", 500);

			runs(function () {
				expect(result).toEqual(['something', 'completly', 'else']);
			});
		});

		it('should .map() correctly', function () {
			var Parallel = require('../../lib/parallel.js');
			var p = new Parallel([1, 2, 3]);

			var done = false;
			var result = null;

			runs(function () {
				Q.when(p.map(function (el) {
					return el + 1;
				})).then(function (data) {
					result = data;
					done = true;
				});
			});

			waitsFor(function () {
				return done;
			}, "it should finish", 500);

			runs(function () {
				expect(result).toEqual([2, 3, 4]);
			});
		});

		it('should queue map work correctly', function () {
			var Parallel = require('../../lib/parallel.js');
			var p = new Parallel([1, 2, 3], { maxWorkers: 2 });

			var done = false;
			var result = null;

			runs(function () {
				Q.when(p.map(function (el) {
					return el + 1;
				})).then(function (data) {
					result = data;
					done = true;
				});
			});

			waitsFor(function () {
				return done;
			}, "it should finish", 500);

			runs(function () {
				expect(result).toEqual([2, 3, 4]);
			});
		});

		it('should chain .map() correctly', function () {
			var Parallel = require('../../lib/parallel.js');
			var p = new Parallel([1, 2, 3]);

			var done = false;
			var result = null;

			runs(function () {
				Q.when(p.map(function (el) {
					return el + 1;
				})).then(function () {
					return p.map(function (el) {
						return el - 1;
					});
				}).then(function (data) {
					result = data;
					done = true;
				});
			});

			waitsFor(function () {
				return done;
			}, "it should finish", 500);

			runs(function () {
				expect(result).toEqual([1, 2, 3]);
			});
		});

		it('should mix .spawn and .map() correctly', function () {
			var Parallel = require('../../lib/parallel.js');
			var p = new Parallel([1, 2, 3]);

			var done = false;
			var result = null;

			runs(function () {
				Q.when(p.map(function (el) {
					return el + 1;
				})).then(function () {
					return p.spawn(function (data) {
						var sum = 0;
						for (var i = 0; i < data.length; ++i) {
							sum += data[i];
						}
						return sum;
					});
				}).then(function (data) {
					result = data;
					done = true;
				});
			});

			waitsFor(function () {
				return done;
			}, "it should finish", 500);

			runs(function () {
				expect(result).toEqual(9);
			});
		});

		it('should execute .reduce() correctly', function () {
			var Parallel = require('../../lib/parallel.js');
			var p = new Parallel([1, 2, 3]);
			var done = false;
			var result = null;

			runs(function () {
				Q.when(p.reduce(function (data) {
					return data[0] + data[1];
				})).then(function (data) {
					result = data;
					done = true;
				});
			});

			waitsFor(function () {
				return done;
			}, "it should finish", 500);

			runs(function () {
				expect(result).toEqual(6);
			});
		});

		it('should process data returned from .then()', function () {
			var Parallel = require('../../lib/parallel.js');
			var p = new Parallel([1, 2, 3]);

			var done = false;
			var result = null;

			runs(function () {
				Q.when(p.map(function (el) {
					return el + 1;
				})).then(function () {
					return p.then(function (data) {
						var sum = 0;
						for (var i = 0; i < data.length; ++i) {
							sum += data[i];
						}
						return sum;
					});
				}).then(function (data) {
					result = data;
					done = true;
				});
			});

			waitsFor(function () {
				return done;
			}, "it should finish", 500);

			runs(function () {
				expect(result).toEqual(9);
			});
		});
	}
});