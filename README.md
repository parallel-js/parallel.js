# Parallel.js

[![Build Status](https://travis-ci.org/parallel-js/parallel.js.svg?branch=master)](https://travis-ci.org/parallel-js/parallel.js)
[![NPM version](https://badge.fury.io/js/paralleljs.svg)](http://badge.fury.io/js/paralleljs)
[![Dependency Status](https://img.shields.io/david/parallel-js/parallel.js.svg)](https://david-dm.org/parallel-js/parallel.js)
[![npm](https://img.shields.io/npm/dm/paralleljs.svg?maxAge=2592000)](https://www.npmjs.com/package/paralleljs)
[![Pull Requests Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat)](http://makeapullrequest.com)
[![first-timers-only Friendly](https://img.shields.io/badge/first--timers--only-friendly-blue.svg)](http://www.firsttimersonly.com/)

**Easy Parallel Computing with Javascript**

Parallel.js is a library for to make parallel computing in Javascript simple. It works in Node.js and in the Web Browser.

Parallel takes advantage of Web Workers for the web, and child processes for Node.

---

## Installation

```bash
npm install paralleljs
```

or

```
<script src='https://unpkg.com/paralleljs@1.0/lib/parallel.js'></script>
```

## Usage

### `Parallel(data, opts)`

This is the constructor. Use it to new up any parallel jobs. The constructor takes an array of data you want to
operate on. This data will be held in memory until you finish your job, and can be accessed via the `.data` attribute
of your job.

The object returned by the `Parallel` constructor is meant to be chained, so you can produce a chain of 
operations on the provided data.

**Arguments**

* `data`: This is the data you wish to operate on. Will often be an array, but the only restrictions are that your values are serializable as JSON.
* `options` (optional): Some options for your job
* `evalPath` (optional): This is the path to the file eval.js. This is required when running in node, and required for some browsers (IE 10) in order to work around cross-domain restrictions for web workers. Defaults to the same location as parallel.js in node environments, and `null` in the browser.
* `maxWorkers` (optional): The maximum number of permitted worker threads. This will default to 4, or the number of cpus on your computer if you're running node
* `synchronous` (optional): If webworkers are not available, whether or not to fall back to synchronous processing using `setTimeout`. Defaults to `true`.

**Example**

```js
const p = new Parallel([1, 2, 3, 4, 5]);

console.log(p.data); // prints [1, 2, 3, 4, 5]
```

---

### `spawn(fn, opts)`

This function will spawn a new process on a worker thread. Pass it the function you want to call. Your
function will receive one argument, which is the current data. The value returned from your spawned function will
update the current data.

**Arguments**

* `fn`: A function to execute on a worker thread. Receives the wrapped data as an argument. The value returned will be assigned to the wrapped data.
* `opts`: An optional object to pass to spawn.
* 'opts.timeout': milliseconds to way for function to return value.  If the worker does not finish in this time, it will be killed.

**Example**

```js
const p = new Parallel('forwards');

// Spawn a remote job (we'll see more on how to use then later)
p.spawn(data => {
  data = data.reverse();
  
  console.log(data); // logs sdrawrof
  
  return data;
})
.then(data => {
  console.log(data) // logs sdrawrof
});
```

---

### `map(fn)`

Map will apply the supplied function to every element in the wrapped data. Parallel will spawn one worker for
each array element in the data, or the supplied maxWorkers argument. The values returned will be stored for 
further processing.

**Arguments**

* `fn`: A function to apply. Receives the wrapped data as an argument. The value returned will be assigned to the wrapped data.

**Example**

```js
const p = new Parallel([0, 1, 2, 3, 4, 5, 6]);
const log = function () { console.log(arguments); };

// One gotcha: anonymous functions cannot be serialzed
// If you want to do recursion, make sure the function
// is named appropriately
function fib(n) {
  return n < 2 ? 1 : fib(n - 1) + fib(n - 2);
};
    
p.map(fib).then(log)

// Logs the first 7 Fibonnaci numbers, woot!
```

---

### `reduce(fn)`

Reduce applies an operation to every member of the wrapped data, and returns a scalar value produced by the operation.
Use it for combining the results of a map operation, by summing numbers for example. This takes a reducing function,
which gets an argument, `data`, an array of the stored value, and the current element.

**Arguments**

* `fn`: A function to apply. Receives the stored value and current element as argument. The value returned will be stored as the current value for the next iteration. Finally, the current value will be assigned to current data.

**Example**

```js
const p = new Parallel([0, 1, 2, 3, 4, 5, 6, 7, 8]);

function add(d) { return d[0] + d[1]; }
function factorial(n) { return n < 2 ? 1 : n * factorial(n - 1); }
function log() { console.log(arguments); }

p.require(factorial)

// Approximate e^10
p.map((n => Math.pow(10, n)).reduce(add).then(log);
```

---

### `then(success, fail)`

The functions given to `then` are called after the last requested operation has finished.
`success` receives the resulting data object, while `fail` will receive an error object.

**Arguments**

- `success`: A function that gets called upon successful completion. Receives the wrapped data as an argument.
- `failure` (optional): A function that gets called if the job fails. The function is passed an error object.

**Example**

```js
const p = new Parallel([1, 2, 3]);

function dbl(n) { return n * 2; }

p
  .map(dbl)
  .map(dbl)
  .map(dbl)
  .then(data => {
    console.log(data); // logs [8, 16, 24]
  });

// Approximate e^10
p
  .map(n => Math.pow(10, n) / factorial(n))
  .reduce(add)
  .then(log);
```

---

### `require(state)`

If you have state that you want to share between your main thread and the worker threads, this is how. Require
takes either a string or a function. A string should point to a file name. Note that in order to
use ```require``` with a file name as an argument, you have to provide the evalPath property in the options
object.

**Example**

```js
let p = new Parallel([1, 2, 3], { evalPath: 'https://raw.github.com/parallel-js/parallel.js/master/lib/eval.js' });

const cubeRoot = n => Math.pow(n, 1 / 3);

// Require a function
p.require(cubeRoot);

// Require a file
p.require('blargh.js');

p.map(d => blargh(20 * cubeRoot(d)));
```

---

## Passing environement to functions

You can pass data to threads that will be global to that worker. This data will be global in each called function.
The data will be available under the `global.env` namespace. The namespace can be configured by passing the 
`envNamespace` option to the `Parallel` constructor. The data you wish to pass should be provided as the `env` option
to the parallel constructor.

Important: Globals can not be mutated between threads.

**Example**

```js
let p = new Parallel([1, 2, 3], {
  env: {
    a: 10
  }
});

// returns 10, 20, 30
p.map(d => d * global.env.a);

// Configure the namespace
p = new Parallel([1, 2, 3], {
  env: {
    a: 10
  },
  envNamespace: 'parallel'
});

p.map(d => d * global.parallel.a);
```

---

## Contributors

Parallel.js is made up of four contributors:

* [Adam Savitzky (Adam)](https://github.com/adambom)
* [Mathias Rangel Wulff (Mathias)](https://github.com/mathiasrw)
* [Amila Welihinda (amilajack)](https://github.com/amilajack)
* [MaXwell Falstein (MaX)](https://github.com/MaXwellFalstein)
