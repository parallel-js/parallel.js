describe('Regression tests', () => {
  const isNode = typeof module !== 'undefined' && module.exports;
  const Worker = isNode
    ? require(`${__dirname}/../../lib/Worker.js`)
    : self.Worker;

  if (!isNode) {
    it('should be possible to use XmlHttpRequest', () => {
      let done = false;
      const p = new Parallel(
        [`http://${window.location.host}${window.location.pathname}`],
        { evalPath: isNode ? undefined : 'lib/eval.js' }
      );

      runs(() => {
        p.map(url => {
          const xhr = new XMLHttpRequest();
          xhr.open('GET', url, false);
          xhr.send(null);
        }).then(() => {
          done = true;
        });
      });

      waitsFor(() => done, 'The request should succeed', 750);
    });
  }
});
