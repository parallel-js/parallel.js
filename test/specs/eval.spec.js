describe('eval.js', () => {
  const isNode = typeof module !== 'undefined' && module.exports;
  const Worker = isNode
    ? require(`${__dirname}/../../lib/Worker.js`)
    : self.Worker;

  it('should eval the given code', () => {
    const wrk = new Worker(
      isNode ? `${__dirname}/../../lib/eval.js` : 'lib/eval.js'
    );

    let result = null;
    let done = false;
    runs(() => {
      wrk.onmessage = function(msg) {
        result = msg.data;
        done = true;
        wrk.terminate();
      };
      wrk.postMessage(
        isNode
          ? 'process.send(JSON.stringify("abc"))'
          : 'self.postMessage("abc")'
      );
    });

    waitsFor(() => done, 'should finish', 500);

    runs(() => {
      expect(result).toEqual('abc');
    });
  });
});
