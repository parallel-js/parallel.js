describe('Performance', () => {
  const isNode = typeof module !== 'undefined' && module.exports;
  const Parallel = isNode ? require('../../lib/parallel.js') : self.Parallel;

  it('.map() should be using multi-threading (could fail on single-core)', () => {
    const slowSquare = function (n) {
      let i = 0;
      while (++i < n * n) { }
      return i;
    };

    const p = new Parallel([10000, 20000, 30000]);
    const p2 = new Parallel([10000, 20000, 30000]);

    let start;
    let time = null;

    runs(() => {
      start = Date.now();

      p.spawn((data) => {
        for (let i = 0; i < data.length; ++i) {
          const n = data[i];
          let square;
          for (square = 0; square < n * n; ++square) { }
          data[i] = square;
        }
        return data;
      }).then((data) => {
        time = Date.now() - start;
      });
    });

    waitsFor(() => {
      return time !== null;
    }, 'Sequential should finish', 5000);

    let start2;
    let time2 = null;

    runs(() => {
      start2 = Date.now();

      p2.map(slowSquare).then((data) => {
        time2 = Date.now() - start2;
      });
    });

    waitsFor(() => {
      return time2 !== null;
    }, 'Parallel should finish', 5000);

    runs(() => {
      expect(time2).toBeLessThan(time * 0.8);
    });
  });
});
