describe('API', function () {
	var isNode = typeof module !== 'undefined' && module.exports;
	var Parallel = isNode ? require('../../lib/parallel.js') : self.Parallel;

	it('should be a constructor', function () {
		expect(Parallel).toEqual(jasmine.any(Function));
	});

	it('should define a .then(cb) function', function () {
		var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js' });
		expect(p.then).toEqual(jasmine.any(Function));
	});

	it('should define a .map(cb) function', function () {
		var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js' });
		expect(p.map).toEqual(jasmine.any(Function));
	});

	it('should define a require(string|function|{ name: string, fn: function }) function', function () {
		var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js' });
		expect(p.require).toEqual(jasmine.any(Function));
	});

	it('should execute a .then function without an operation immediately', function () {
		var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js' });
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
		var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js' });

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
		var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js' });

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

	it('should queue map work correctly', function () {
		var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js', maxWorkers: 2 });

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
		var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js' });

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
		var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js' });

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

	it('should execute .reduce() correctly', function () {
		var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js' });
		var done = false;
		var result = null;

		runs(function () {
			p.reduce(function (data) {
				return data[0] + data[1];
			}).then(function (data) {
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
		var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js' });

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

	if (!isNode) {
		it('should work with require()d scripts (web-exclusive)', function () {
			var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js' });
			p.require('../test/test.js'); // relative to eval.js

			var done = false;
			var result = null;

			runs(function () {
				p.map(function (el) {
					return myCalc(el, 25);
				}).then(function (data) {
					result = data;
					done = true;
				});
			});

			waitsFor(function () {
				return done;
			}, "it should finish", 500);

			runs(function () {
				expect(result).toEqual([26, 27, 28]);
			});
		});
	}

	it('should allow chaining require()', function () {
		var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js' });
		var ret = p.require({ name: 'fn', fn: function () { } });

		expect(ret).toEqual(jasmine.any(Parallel));
	});

	it('should work with require()d anonymous functions', function () {
		var fn = function (el, amount) {
			return el + amount;
		};
		var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js' });
		p.require({ name: 'fn', fn: fn });

		var done = false;
		var result = null;

		runs(function () {
			p.map(function (el) {
				return fn(el, 25);
			}).then(function (data) {
				result = data;
				done = true;
			});
		});

		waitsFor(function () {
			return done;
		}, "it should finish", 500);

		runs(function () {
			expect(result).toEqual([26, 27, 28]);
		});
	});

	it('should accept more than one requirement', function () {
		var fn = function (el, amount) {
			return el + amount;
		};

		function factorial(n) { return n < 2 ? 1 : n * factorial(n - 1); }

		var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js' });
		p.require({ name: 'fn', fn: fn }, factorial);

		var done = false;
		var result = null;

		runs(function () {
			p.map(function (el) {
				return fn(factorial(el), 25);
			}).then(function (data) {
				result = data;
				done = true;
			});
		});

		waitsFor(function () {
			return done;
		}, "it should finish", 500);

		runs(function () {
			expect(result).toEqual([26, 27, 31]);
		});
	});
});