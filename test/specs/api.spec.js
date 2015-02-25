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
		}, "it should finish", 2000);
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
		}, "it should finish", 2000);

		runs(function () {
			expect(result).toEqual(['something', 'completly', 'else']);
		});
	});

	it('should .spawn() handle errors', function () {
	  if (isNode) return;

	  var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js' });

	  var done = false;
	  var error = null;

	  runs(function () {
	    p.spawn(function (data) {
	      throw ('Test error');
	      return ['something', 'completly', 'else'];
	    }).then(function () {

	    }, function (e) {
	      error = e;
	      done = true;
	    });
	  });

	  waitsFor(function () {
	    return done;
	  }, "it should finish", 2000);

	  runs(function () {
	    expect(typeof error).toEqual('object');
	    expect(error.message).toMatch(/Test\serror/);
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
		}, "it should finish", 2000);

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
		}, "it should finish", 2000);

		runs(function () {
			expect(result).toEqual([2, 3, 4]);
		});
	});

	it('should map handle error correctly', function () {
		if(isNode) return;

		var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js', maxWorkers: 2 });

		var done = false;
		var fail = false;
		var error = null;
		var result = null;

		runs(function () {
			p.map(function (el) {
				if(el === 2) throw('Test error');
				return el + 1;
			}).then(function (data) {
				result = data;
				done = true;
			}, function(e){
				error = e;
				fail = true;
			});
		});

		waitsFor(function () {
			return fail;
		}, "it should finish", 2000);

		runs(function () {
			expect(result).toEqual(null);
			expect(typeof error).toEqual('object');
			expect(error.message).toMatch(/Test\serror/);
		});
	});

	it('should only fire promise once for errors + successful calls', function () {
	  if (isNode) return;

	  var p = new Parallel([1, 2, 3], { evalPath: 'lib/eval.js' });

	  var done = false;
	  var fires = 0;

	  runs(function () {
	    p.map(function (el) {
	      if (el === 1) throw new Error('a');
	      return el;
	    }).then(function (data) {
	      fires++;
	    }, function () {
	      fires++;
	    });
	  });

	  setTimeout(function () {
	  	done = true;
	  }, 2000);

	  waitsFor(function () {
	    return done;
	  }, "it should finish", 3000);

	  runs(function () {
	    expect(fires).toEqual(1);
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
		}, "it should finish", 2000);

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
		}, "it should finish", 2000);

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
		}, "it should finish", 2000);

		runs(function () {
			expect(result).toEqual(6);
		});
	});

	it('should reduce handle error correctly', function () {
		if(isNode) return;
		var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js', maxWorkers: 2 });

		var done = false;
		var fail = false;
		var error = null;
		var result = null;

		runs(function () {
			p.reduce(function (n) {
				if(n[1] === 2) throw('Test error');
				return n[0] + n[1];
			}).then(function (data) {
				result = data;
				done = true;
			}, function(e){
				error = e;
				fail = true;
			});
		});

		waitsFor(function () {
			return fail;
		}, "it should finish", 2000);

		runs(function () {
			expect(result).toEqual(null);
			expect(typeof error).toEqual('object');
			expect(error.message).toMatch(/Test\serror/);
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
		}, "it should finish", 2000);

		runs(function () {
			expect(result).toEqual(9);
		});
	});

	it('should process data returned from .then() when errCb occurs', function () {
		if(isNode) return;
		var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js' });

		var done = false;
		var result = null;

		runs(function () {
			p.map(function (el) {
				if(el === 2) throw('Test error');
				return el + 1;
			}).then(function (data) {
				// some stuff
			}, function(e){
				return 5;
			}).then(function (data) {
				result = data;
				done = true;
			});
		});

		waitsFor(function () {
			return done;
		}, "it should finish", 2000);

		runs(function () {
			expect(result).toEqual(5);
		});
	});

	it('should process data returned from .then() when error occurs into then', function () {
		if(isNode) return;
		var p = new Parallel([1, 2, 3], { evalPath: isNode ? undefined : 'lib/eval.js' });

		var done = false;
		var result = null;
		var fail = false;
		var error = null;

		runs(function () {
			p.map(function (el) {
				return el + 1;
			}).then(function (data) {
				throw('Test error');
			}, function(e){
				error = e;
				fail = true;
				return 5;
			}).then(function (data) {
				result = data;
				done = true;
			}, function(){
				//some stuff
			});
		});

		waitsFor(function () {
			return done;
		}, "it should finish", 2000);

		waitsFor(function () {
			return fail;
		}, "it should finish", 2000);

		runs(function () {
			expect(result).toEqual(5);
			expect(error).toMatch(/Test\serror/);
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
			}, "it should finish", 2000);

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
		}, "it should finish", 2000);

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
		}, "it should finish", 2000);

		runs(function () {
			expect(result).toEqual([26, 27, 31]);
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

	it('should allow configuring global namespace', function () {
		var p = new Parallel([1, 2, 3], {
			evalPath: isNode ? undefined : 'lib/eval.js',
			env: { a: 1 },
			envNamespace: 'other'
		});

		var done = false;
		var result = null;

		runs(function () {
			p.spawn(function (data) {
				return global.other.a * 2;
			}).then(function (data) {
				result = data;
				done = true;
			});
		});

		waitsFor(function () {
			return done;
		}, "it should finish", 2000);

		runs(function () {
			expect(result).toEqual(2);
		});
	});
});