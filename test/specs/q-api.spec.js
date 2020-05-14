describe('Q-API', () => {
  const isNode = typeof module !== 'undefined' && module.exports;

  function addOne(el) {
    return el + 1;
  }

  function sum(a, b) {
    return a + b;
  }

  if (isNode) {
    const Q = require('q');

    it('should execute .spawn() correctly', () => {
      return new Promise(done => {
        const Parallel = require('../../lib/parallel.js');
        const p = new Parallel([1, 2, 3]);

        Q.when(p.spawn(data => ['something', 'completely', 'else'])).then(
          data => {
            expect(data).toEqual(['something', 'completely', 'else']);
            done();
          }
        );
      });
    });

    it('should .map() correctly', () => {
      return new Promise(done => {
        const Parallel = require('../../lib/parallel.js');
        const p = new Parallel([1, 2, 3]);

        Q.when(p.map(addOne)).then(data => {
          expect(data).toEqual([2, 3, 4]);
          done();
        });
      });
    });

    it('should queue map work correctly', () => {
      const Parallel = require('../../lib/parallel.js');
      const p = new Parallel([1, 2, 3], { maxWorkers: 2 });

      Q.when(p.map(addOne)).then(data => {
        expect(data).toEqual([2, 3, 4]);
      });
    });

    it('should chain .map() correctly', () => {
      return new Promise(done => {
        const Parallel = require('../../lib/parallel.js');
        const p = new Parallel([1, 2, 3]);

        Q.when(p.map(addOne))
          .then(() => p.map(el => el - 1))
          .then(data => {
            expect(data).toEqual([1, 2, 3]);
            done();
          });
      });
    });

    it('should mix .spawn and .map() correctly', () => {
      const Parallel = require('../../lib/parallel.js');
      const p = new Parallel([1, 2, 3]);

      Q.when(p.map(addOne))
        .then(() => p.spawn(data => data.reduce((a,b)=>a+b,0)))
        .then(data => {
          expect(result).toEqual(9);
        });
    });

    it('should execute .reduce() correctly', () => {
      return new Promise(done => {
        const Parallel = require('../../lib/parallel.js');
        const p = new Parallel([1, 2, 3]);

        Q.when(p.reduce(data => data[0] + data[1])).then(data => {
          expect(data).toEqual(6);
          done();
        });
      });
    });

    it('should process data returned from .then()', () => {
      return new Promise(done => {
        const Parallel = require('../../lib/parallel.js');
        const p = new Parallel([1, 2, 3]);

        Q.when(p.map(addOne))
          .then(qe => p.then(data => data.reduce((a,b)=>a+b,0)))
          .then(data => {
            expect(data).toEqual(9);
            done();
          });
      });
    });
  }
});
