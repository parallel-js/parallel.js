describe('API', function () {
	var isNode = typeof module !== 'undefined' && module.exports;
	var Parallel = isNode ? require('../../lib/parallel.js') : self.Parallel;

	function addOne(el) {
		return el + 1;
	}
	
	function sum(a, b) {
		return a + b;
	}

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

	it('should execute a .then function without an operation immediately', function (done) {
		var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js' });
		expect(p.then).toEqual(jasmine.any(Function));

		p.then(function () {
			expect('finished').toEqual('finished');
			done();
		});
	});

	it('should execute .spawn() correctly', function (done) {
		var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js' });

		p.spawn(function (data) {
			return ['something', 'completly', 'else'];
		}).then(function (data) {
			expect(data).toEqual(['something', 'completly', 'else']);
			done();
		});
	});

	it('should .spawn() handle errors', function (done) {
	  if (isNode) {
	  	done();
	  	return;
	  }

	  var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js' });

    p.spawn(function (data) {
      throw ('Test error');
      return ['something', 'completly', 'else'];
    }).then(function () {}, function (error) {
      expect(typeof error).toEqual('object');
	    expect(error.message).toMatch(/Test\serror/);
	    done();
    });
	});

	it('should .map() correctly', function (done) {
		var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js' });

		p.map(addOne).then(function (data) {
			expect(data).toEqual([2, 3, 4]);
			done();
		});
	});

	it('should queue map work correctly', function (done) {
		var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js', maxWorkers: 2 });

		p.map(addOne).then(function (data) {
			expect(data).toEqual([2, 3, 4]);
			done();
		});
	});

	it('should map handle error correctly', function (done) {
		if (isNode) {
			done();
			return;
		}

		var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js', maxWorkers: 2 });

		p.map(function (el) {
			if (el === 2) throw('Test error');
			return el + 1;
		}).then(function () {}, function (error) {
			expect(typeof error).toEqual('object');
			expect(error.message).toMatch(/Test\serror/);
			done();
		});
	});

	it('should only fire promise once for errors + successful calls', function (done) {
	  if (isNode) {
	  	done();
	  	return;
	  }

	  var p = new Parallel([1, 2, 3], { evalPath: 'lib/eval.js' });
	  var fires = 0;

    p.map(function (el) {
      if (el === 1) throw new Error('a');
      return el;
    }).then(function (data) {
      fires++;
      expect(fires).toEqual(1);
      done();
    }, function () {
      fires++;
    });
	});

	it('should chain .map() correctly', function (done) {
		var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js' });

		p.map(addOne).map(function (el) {
			return el - 1;
		}).then(function (data) {
			expect(data).toEqual([1, 2, 3]);
			done();
		});
	});

	it('should mix .spawn and .map() correctly', function (done) {
		var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js' });

		p.map(addOne).spawn(function (data) {
			return data.reduce(function (a, b) {
				return a + b;
			});
		}).then(function (data) {
			expect(data).toEqual(9);
			done();
		});
	});

	it('should execute .reduce() correctly', function (done) {
		var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js' });

		p.reduce(function (data) {
			return data[0] + data[1];
		}).then(function (data) {
			expect(data).toEqual(6);
			done();
		});
	});

	it('should reduce handle error correctly', function (done) {
		if(isNode) {
			done();
			return;
		}

		var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js', maxWorkers: 2 });

		p.reduce(function (n) {
			if(n[1] === 2) throw('Test error');
			return n[0] + n[1];
		}).then(function () {}, function(error){
			expect(typeof error).toEqual('object');
			expect(error.message).toMatch(/Test\serror/);
			done();
		});
	});

	it('should process data returned from .then()', function (done) {
		var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js' });

		p.map(addOne).then(function (data) {
			return data.reduce(sum);
		}).then(function (data) {
			expect(data).toEqual(9);
			done();
		});
	});

	it('should process data returned from .then() when errCb occurs', function (done) {
		if (isNode) {
			done();
			return;
		}
		var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js' });

		p.map(function (el) {
			if (el === 2) throw('Test error');
			return el + 1;
		}).then(function (data) {}, function (error) {
			return 5;
		}).then(function (data) {
			expect(data).toEqual(5);
			done();
		});
	});

	it('should process data returned from .then() when error occurs into then', function (done) {
		if (isNode) {
			done();
			return;
		}

		var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js' });

		p.map(function (el) {
			return el + 1;
		}).then(function (data) {
			throw('Test error');
		}, function(error){
			expect(error).toMatch(/Test\serror/);
			return 5;
		}).then(function (data) {
			expect(data).toEqual(5);
			done();
		}, function(){
			//some stuff
		});
	});

	if (!isNode) {
		it('should work with require()d scripts (web-exclusive)', function (done) {
			var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js' });
			p.require('../test/test.js'); // relative to eval.js

			p.map(function (el) {
				return myCalc(el, 25);
			}).then(function (data) {
				expect(data).toEqual([26, 27, 28]);
				done();
			});
		});
	}

	it('should allow chaining require()', function () {
		var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js' });
		var ret = p.require({ name: 'fn', fn: function () { } });

		expect(ret).toEqual(jasmine.any(Parallel));
	});

	it('should work with require()d anonymous functions', function (done) {
		var fn = function (el, amount) {
			return el + amount;
		};
		var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js' });
		p.require({ name: 'fn', fn: fn });

		p.map(function (el) {
			return fn(el, 25);
		}).then(function (data) {
			expect(data).toEqual([26, 27, 28]);
			done();
		});
	});

	it('should accept more than one requirement', function (done) {
		function factorial(n) { return n < 2 ? 1 : n * factorial(n - 1); }

		var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js' });
		p.require({ name: 'sum', fn: sum }, factorial);

		p.map(function (el) {
			return sum(factorial(el), 25);
		}).then(function (data) {
			expect(data).toEqual([26, 27, 31]);
			done();
		});
	});

	it('should allow environment to be passed in constructor', function () {
		var env = { a: 1, b: 2 };
		var p
		var doneSpawn = false;
		var doneMap = false;
		var doneReduce = false;
		var resultSpawn = null;
		var resultMap = null;
		var resultReduce = null;

		runs(function () {
			p = new Parallel([1, 2, 3], {
				evalPath: isNode ? undefined : 'lib/eval.js',
				env: env
			});

			p.spawn(function (data) {
				return global.env.a * 2;
			}).then(function (data) {
				resultSpawn = data;
				doneSpawn = true;
			});

			p = new Parallel([1, 2, 3], {
				evalPath: isNode ? undefined : 'lib/eval.js',
				env: env
			});

			p.map(function (data) {
				return data * global.env.b;
			}).then(function (data) {
				resultMap= data;
				doneMap = true;
			});

			p = new Parallel([1, 2, 3], {
				evalPath: isNode ? undefined : 'lib/eval.js',
				env: env
			});

			p.reduce(function (data) {
				return data[0] + data[1] * global.env.b;
			}).then(function (data) {
				resultReduce= data;
				doneReduce = true;
			});
		});

		waitsFor(function () {
			return doneSpawn && doneMap && doneReduce;
		}, "it should finish", 2000);

		runs(function () {
			expect(resultSpawn).toEqual(2);
			expect(resultMap).toEqual([2, 4, 6]);
			expect(resultReduce).toEqual(13);
		});
	});

	it('should allow overriding default environment', function () {
		var env = { a: 1, b: 2 };
		var p
		var doneSpawn = false;
		var doneMap = false;
		var doneReduce = false;
		var resultSpawn = null;
		var resultMap = null;
		var resultReduce = null;

		runs(function () {
			p = new Parallel([1, 2, 3], {
				evalPath: isNode ? undefined : 'lib/eval.js',
				env: env
			});

			p.spawn(function (data) {
				return global.env.a * 2;
			}, { a: 2 }).then(function (data) {
				resultSpawn = data;
				doneSpawn = true;
			});

			p = new Parallel([1, 2, 3], {
				evalPath: isNode ? undefined : 'lib/eval.js',
				env: env
			});

			p.map(function (data) {
				return data * global.env.b;
			}, { b: 3 }).then(function (data) {
				resultMap= data;
				doneMap = true;
			});

			p = new Parallel([1, 2, 3], {
				evalPath: isNode ? undefined : 'lib/eval.js',
				env: env
			});

			p.reduce(function (data) {
				return data[0] + data[1] * global.env.b;
			}, { b: 3 }).then(function (data) {
				resultReduce= data;
				doneReduce = true;
			});
		});

		waitsFor(function () {
			return doneSpawn && doneMap && doneReduce;
		}, "it should finish", 2000);

		runs(function () {
			expect(resultSpawn).toEqual(4);
			expect(resultMap).toEqual([3, 6, 9]);
			expect(resultReduce).toEqual(24);
		});
	});

	it('should allow configuring global namespace', function (done) {
		var p = new Parallel([1, 2, 3], {
			evalPath: isNode ? undefined : 'lib/eval.js',
			env: { a: 1 },
			envNamespace: 'other'
		});

		p.spawn(function (data) {
			return global.other.a * 2;
		}).then(function (data) {
			expect(data).toEqual(2);
			done();
		});
	});
});