const { ParallelArray, Jobs } = require('..');

const fibonacci = () => {};
const gaussianSumm = () => {};
const foobar = () => {};

describe('basic', () => {
  it('should construct object', () => {
    new ParallelArray([]);
    new ParallelArray();
  });

  it('should take expected arguments', () => {
    const array = new ParallelArray();
    array.push(1);
    array.push(2);
  });

  it('should call parallel methods', () => {
    const array = new ParallelArray();
    array.map(e => e + 1);
    array.filter(e => !!e);
  });

  it('should call execute jobs in parallel', async () => {
    const jobs = new Jobs();
    const [job1, job2, job3] = await jobs.all([
      () => fibonacci(1),
      gaussianSumm,
      foobar
    ]);
    console.log(job1, job2, job3);
  });
});
