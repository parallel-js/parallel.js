describe('API', function () {
	it('should be a constructor', function () {
		var Parallel = require('../lib/parallel.js');
		expect(Parallel).toEqual(jasmine.any(Function));
	});

	it('should define a .then(cb) function', function () {
		var Parallel = require('../lib/parallel.js');
		var p = new Parallel([1, 2, 3]);
		expect(p.then).toEqual(jasmine.any(Function));
	});

	it('should define a .map(cb) function', function () {
		var Parallel = require('../lib/parallel.js');
		var p = new Parallel([1, 2, 3]);
		expect(p.map).toEqual(jasmine.any(Function));
	});

	it('should execute a .then function without an operation immediately', function () {
		var Parallel = require('../lib/parallel.js');
		var p = new Parallel([1, 2, 3]);
		expect(p.then).toEqual(jasmine.any(Function));

		var done = false;
		runs(function () {
			p.then(function () {
				done = true;
			});
		});
		waitsFor(function () {
			return done;
		}, "it should finish", 500);
	});

	it('should execute .spawn() correctly', function () {
		var Parallel = require('../lib/parallel.js');
		var p = new Parallel([1, 2, 3]);

		var done = false;
		var result = null;

		runs(function () {
			p.spawn(function (data) {
				return ['something', 'completly', 'else'];
			}).then(function (data) {
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
		var Parallel = require('../lib/parallel.js');
		var p = new Parallel([1, 2, 3]);

		var done = false;
		var result = null;

		runs(function () {
			p.map(function (el) {
				return el + 1;
			}).then(function (data) {
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
		var Parallel = require('../lib/parallel.js');
		var p = new Parallel([1, 2, 3]);

		var done = false;
		var result = null;

		runs(function () {
			p.map(function (el) {
				return el + 1;
			}).map(function (el) {
				return el - 1;
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
		var Parallel = require('../lib/parallel.js');
		var p = new Parallel([1, 2, 3]);

		var done = false;
		var result = null;

		runs(function () {
			p.map(function (el) {
				return el + 1;
			}).spawn(function (data) {
				var sum = 0;
				for (var i = 0; i < data.length; ++i) {
					sum += data[i];
				}
				return sum;
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

	it('should process data returned from .then()', function () {
		var Parallel = require('../lib/parallel.js');
		var p = new Parallel([1, 2, 3]);

		var done = false;
		var result = null;

		runs(function () {
			p.map(function (el) {
				return el + 1;
			}).then(function (data) {
				var sum = 0;
				for (var i = 0; i < data.length; ++i) {
					sum += data[i];
				}
				return sum;
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
});