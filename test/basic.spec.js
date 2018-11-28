const Parallel = require('..');

describe('basic', () => {
  it('should construct object', () => {
    new Parallel([]);
    new Parallel();
  });

  it('should take expected arguments', () => {
    const array = new Parallel();
    array.push(1);
    array.push(2);
  });

  it('should call parallel methods', () => {
    const array = new Parallel();
    array.map(e => e + 1);
    array.filter(e => !!e);
  });
});
