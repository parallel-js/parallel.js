/* eslint jest/no-jasmine-globals: off */

describe('WebWorker-API', () => {
  const isNode = typeof module !== 'undefined' && module.exports;
  const Worker = isNode
    ? require(`${__dirname}/../../lib/Worker.js`)
    : self.Worker;

  it('should define the used API', () => {
    expect(Worker).toEqual(jasmine.any(Function));
    const wrk = new Worker(
      isNode ? `${__dirname}/../../lib/eval.js` : 'lib/eval.js'
    );
    expect(wrk.postMessage).toEqual(jasmine.any(Function));
    expect(wrk.terminate).toEqual(jasmine.any(Function));
    wrk.terminate();
  });

  if (isNode) {
    it('should terminate correctly', () => {
      const wrk = new Worker(`${__dirname}/../../lib/eval.js`);

      let done = false;
      runs(() => {
        wrk.process.on('exit', () => {
          done = true;
        });
        wrk.terminate();
      });

      waitsFor(() => done, 'terminating correctly', 500);
    });
  }
});
