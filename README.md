# Parallel.js

[![Build Status](https://travis-ci.org/parallel-js/parallel.js.svg?branch=master)](https://travis-ci.org/parallel-js/parallel.js)

## Idea

```js
import { Jobs, ParallelArray } from 'paralleljs';

// Execute multiple jobs in parallel and asynchrnously
const jobs = new Jobs();
const [job1, job2, job3] = await jobs.all([
  () => fibonacci(1),
  gaussianSumm,
  foobar
]);
console.log(job1, job2, job3);

// An array with all methods parallelized
const array = new ParallelArray([1, 2, 3]);
array.push(1);
array.map(e => e + 1);
array.filter(e => !!e);
```

## Local Development

```bash
git clone https://github.com/parallel-js/parallel.js
cd parallel.js
yarn
yarn test
```

## Contributors

Parallel.js is made up of four contributors:

* [Adam Savitzky (Adam)](https://github.com/adambom)
* [Mathias Rangel Wulff (Mathias)](https://github.com/mathiasrw)
* [Amila Welihinda (amilajack)](https://github.com/amilajack)
* [MaXwell Falstein (MaX)](https://github.com/MaXwellFalstein)
