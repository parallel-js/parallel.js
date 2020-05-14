describe('API', () => {
  const isNode = typeof module !== 'undefined' && module.exports;
  const Parallel = isNode ? require('../../lib/parallel.js') : self.Parallel;

  function addOne(el) {
    return el + 1;
  }

  function sum(a, b) {
    return a + b;
  }

  it('should be a constructor', () => {
    expect(Parallel).toEqual(jasmine.any(Function));
  });

  it('should define a .then(cb) function', () => {
    const p = new Parallel([1, 2, 3], {
      evalPath: isNode ? undefined : 'lib/eval.js'
    });
    expect(p.then).toEqual(jasmine.any(Function));
  });

  it('should define a .map(cb) function', () => {
    const p = new Parallel([1, 2, 3], {
      evalPath: isNode ? undefined : 'lib/eval.js'
    });
    expect(p.map).toEqual(jasmine.any(Function));
  });

  it('should define a require(string|function|{ name: string, fn: function }) function', () => {
    const p = new Parallel([1, 2, 3], {
      evalPath: isNode ? undefined : 'lib/eval.js'
    });
    expect(p.require).toEqual(jasmine.any(Function));
  });

  it('should execute a .then function without an operation immediately', () => {
    return new Promise(done => {
      const p = new Parallel([1, 2, 3], {
        evalPath: isNode ? undefined : 'lib/eval.js'
      });
      expect(p.then).toEqual(jasmine.any(Function));

      p.then(() => {
        expect('finished').toEqual('finished');
        done();
      });
    });
  });

  it('should execute .spawn() correctly', () => {
    return new Promise(done => {
      const p = new Parallel([1, 2, 3], {
        evalPath: isNode ? undefined : 'lib/eval.js'
      });

      p.spawn(data => ['something', 'completly', 'else']).then(data => {
        expect(data).toEqual(['something', 'completly', 'else']);
        done();
      });
    });
  });

  it('should .spawn() handle errors', () => {
    return new Promise(done => {
      if (isNode) {
        done();
        return;
      }

      const p = new Parallel([1, 2, 3], {
        evalPath: isNode ? undefined : 'lib/eval.js'
      });

      p.spawn(data => {
        throw 'Test error';
        return ['something', 'completly', 'else'];
      }).then(
        () => {},
        error => {
          expect(typeof error).toEqual('object');
          expect(error.message).toMatch(/Test\serror/);
          done();
        }
      );
    });
  });

  it('should .map() correctly', () => {
    return new Promise(done => {
      const p = new Parallel([1, 2, 3], {
        evalPath: isNode ? undefined : 'lib/eval.js'
      });

      p.map(addOne).then(data => {
        expect(data).toEqual([2, 3, 4]);
        done();
      });
    });
  });

  it('should queue map work correctly', () => {
    return new Promise(done => {
      const p = new Parallel([1, 2, 3], {
        evalPath: isNode ? undefined : 'lib/eval.js',
        maxWorkers: 2
      });

      p.map(addOne).then(data => {
        expect(data).toEqual([2, 3, 4]);
        done();
      });
    });
  });

  it('should map handle error correctly', () => {
    return new Promise(done => {
      if (isNode) {
        done();
        return;
      }

      const p = new Parallel([1, 2, 3], {
        evalPath: isNode ? undefined : 'lib/eval.js',
        maxWorkers: 2
      });

      p.map(el => {
        if (el === 2) throw 'Test error';
        return el + 1;
      }).then(
        () => {},
        error => {
          expect(typeof error).toEqual('object');
          expect(error.message).toMatch(/Test\serror/);
          done();
        }
      );
    });
  });

  it('should only fire promise once for errors + successful calls', () => {
    return new Promise(done => {
      if (isNode) {
        done();
        return;
      }

      const p = new Parallel([1, 2, 3], { evalPath: 'lib/eval.js' });
      let fires = 0;

      p.map(el => {
        if (el === 1) throw new Error('a');
        return el;
      }).then(
        data => {
          fires++;
          expect(fires).toEqual(1);
          done();
        },
        () => {
          fires++;
        }
      );
    });
  });

  it('should chain .map() correctly', () => {
    return new Promise(done => {
      const p = new Parallel([1, 2, 3], {
        evalPath: isNode ? undefined : 'lib/eval.js'
      });

      p.map(addOne)
        .map(el => el - 1)
        .then(data => {
          expect(data).toEqual([1, 2, 3]);
          done();
        });
    });
  });

  it('should mix .spawn and .map() correctly', () => {
    return new Promise(done => {
      const p = new Parallel([1, 2, 3], {
        evalPath: isNode ? undefined : 'lib/eval.js'
      });

      p.map(addOne)
        .spawn(data => data.reduce((a, b) => a + b))
        .then(data => {
          expect(data).toEqual(9);
          done();
        });
    });
  });

  it('should execute .reduce() correctly', () => {
    return new Promise(done => {
      const p = new Parallel([1, 2, 3], {
        evalPath: isNode ? undefined : 'lib/eval.js'
      });

      p.reduce(data => data[0] + data[1]).then(data => {
        expect(data).toEqual(6);
        done();
      });
    });
  });

  it('should reduce handle error correctly', () => {
    return new Promise(done => {
      if (isNode) {
        done();
        return;
      }

      const p = new Parallel([1, 2, 3], {
        evalPath: isNode ? undefined : 'lib/eval.js',
        maxWorkers: 2
      });

      p.reduce(n => {
        if (n[1] === 2) throw 'Test error';
        return n[0] + n[1];
      }).then(
        () => {},
        error => {
          expect(typeof error).toEqual('object');
          expect(error.message).toMatch(/Test\serror/);
          done();
        }
      );
    });
  });

  it('should process data returned from .then()', () => {
    return new Promise(done => {
      const p = new Parallel([1, 2, 3], {
        evalPath: isNode ? undefined : 'lib/eval.js'
      });

      p.map(addOne)
        .then(data => data.reduce((a,b)=>a+b,0))
        .then(data => {
          expect(data).toEqual(9);
          done();
        });
    });
  });

  it('should process data returned from .then() when errCb occurs', () => {
    return new Promise(done => {
      if (isNode) {
        done();
        return;
      }
      const p = new Parallel([1, 2, 3], {
        evalPath: isNode ? undefined : 'lib/eval.js'
      });

      p.map(el => {
        if (el === 2) throw 'Test error';
        return el + 1;
      })
        .then(
          data => {},
          error => 5
        )
        .then(data => {
          expect(data).toEqual(5);
          done();
        });
    });
  });

  it('should process data returned from .then() when error occurs into then', () => {
    return new Promise(done => {
      if (isNode) {
        done();
        return;
      }

      const p = new Parallel([1, 2, 3], {
        evalPath: isNode ? undefined : 'lib/eval.js'
      });

      p.map(el => el + 1)
        .then(
          data => {
            throw 'Test error';
          },
          error => {
            expect(error).toMatch(/Test\serror/);
            return 5;
          }
        )
        .then(
          data => {
            expect(data).toEqual(5);
            done();
          },
          () => {
            // some stuff
          }
        );
    });
  });

  if (!isNode) {
    it('should work with require()d scripts (web-exclusive)', () => {
      return new Promise(done => {
        const p = new Parallel([1, 2, 3], {
          evalPath: isNode ? undefined : 'lib/eval.js'
        });
        p.require('../test/test.js'); // relative to eval.js

        p.map(el => myCalc(el, 25)).then(data => {
          expect(data).toEqual([26, 27, 28]);
          done();
        });
      });
    });
  }

  it('should allow chaining require()', () => {
    const p = new Parallel([1, 2, 3], {
      evalPath: isNode ? undefined : 'lib/eval.js'
    });
    const ret = p.require({ name: 'fn', fn() {} });

    expect(ret).toEqual(jasmine.any(Parallel));
  });

  it('should work with require()d anonymous functions', () => {
    return new Promise(done => {
      const fn = function(el, amount) {
        return el + amount;
      };
      const p = new Parallel([1, 2, 3], {
        evalPath: isNode ? undefined : 'lib/eval.js'
      });
      p.require({ name: 'fn', fn });

      p.map(el => fn(el, 25)).then(data => {
        expect(data).toEqual([26, 27, 28]);
        done();
      });
    });
  });

  it('should accept more than one requirement', () => {
    return new Promise(done => {
      function factorial(n) {
        return n < 2 ? 1 : n * factorial(n - 1);
      }

      const p = new Parallel([1, 2, 3], {
        evalPath: isNode ? undefined : 'lib/eval.js'
      });
      p.require({ name: 'sum', fn: sum }, factorial);

      p.map(el => sum(factorial(el), 25)).then(data => {
        expect(data).toEqual([26, 27, 31]);
        done();
      });
    });
  });

  it('should allow environment to be passed in constructor', () => {
    const env = { a: 1, b: 2 };
    let p;
    let doneSpawn = false;
    let doneMap = false;
    let doneReduce = false;
    let resultSpawn = null;
    let resultMap = null;
    let resultReduce = null;

    runs(() => {
      p = new Parallel([1, 2, 3], {
        evalPath: isNode ? undefined : 'lib/eval.js',
        env
      });

      p.spawn(data => global.env.a * 2).then(data => {
        resultSpawn = data;
        doneSpawn = true;
      });

      p = new Parallel([1, 2, 3], {
        evalPath: isNode ? undefined : 'lib/eval.js',
        env
      });

      p.map(data => data * global.env.b).then(data => {
        resultMap = data;
        doneMap = true;
      });

      p = new Parallel([1, 2, 3], {
        evalPath: isNode ? undefined : 'lib/eval.js',
        env
      });

      p.reduce(data => data[0] + data[1] * global.env.b).then(data => {
        resultReduce = data;
        doneReduce = true;
      });
    });

    waitsFor(
      () => doneSpawn && doneMap && doneReduce,
      'it should finish',
      2000
    );

    runs(() => {
      expect(resultSpawn).toEqual(2);
      expect(resultMap).toEqual([2, 4, 6]);
      expect(resultReduce).toEqual(13);
    });
  });

  it('should allow overriding default environment', () => {
    const env = { a: 1, b: 2 };
    let p;
    let doneSpawn = false;
    let doneMap = false;
    let doneReduce = false;
    let resultSpawn = null;
    let resultMap = null;
    let resultReduce = null;

    runs(() => {
      p = new Parallel([1, 2, 3], {
        evalPath: isNode ? undefined : 'lib/eval.js',
        env
      });

      p.spawn(data => global.env.a * 2, { a: 2 }).then(data => {
        resultSpawn = data;
        doneSpawn = true;
      });

      p = new Parallel([1, 2, 3], {
        evalPath: isNode ? undefined : 'lib/eval.js',
        env
      });

      p.map(data => data * global.env.b, { b: 3 }).then(data => {
        resultMap = data;
        doneMap = true;
      });

      p = new Parallel([1, 2, 3], {
        evalPath: isNode ? undefined : 'lib/eval.js',
        env
      });

      p.reduce(data => data[0] + data[1] * global.env.b, { b: 3 }).then(
        data => {
          resultReduce = data;
          doneReduce = true;
        }
      );
    });

    waitsFor(
      () => doneSpawn && doneMap && doneReduce,
      'it should finish',
      2000
    );

    runs(() => {
      expect(resultSpawn).toEqual(4);
      expect(resultMap).toEqual([3, 6, 9]);
      expect(resultReduce).toEqual(24);
    });
  });

  it('should allow configuring global namespace', () => {
    return new Promise(done => {
      const p = new Parallel([1, 2, 3], {
        evalPath: isNode ? undefined : 'lib/eval.js',
        env: { a: 1 },
        envNamespace: 'other'
      });

      p.spawn(data => global.other.a * 2).then(data => {
        expect(data).toEqual(2);
        done();
      });
    });
  });
});
