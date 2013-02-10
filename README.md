Parallel.js
==============

#### Parallel Computing with Javascript

Parallel.js is a tiny library for multi-core processing in Javascript. It was created to take full advantage of the ever-maturing web-workers API. Javascript is fast, no doubt, but lacks the parallel computing capabilites of its peer languages due to its single-threaded computing model. In a world where the numbers of cores on a CPU are increasing faster than the speed of the cores themselves, isn't it a shame that we can't take advantage of this raw parallelism?

Parallel.js solves that problem by giving you high level access to multicore processing using web workers. It runs in your browser (as long as it supports web workers). Check it out.

# Usage

Include parallel.js in your project like so:

```html
<script src="underscore.js"></script>
<script src="parallel.js"></script>
```

This will give you access to the global variable, `Parallel`.

## Parallel.spawn

`spawn` takes a function and a list of arguments and spawns a worker thread for computing the result of your function. `spawn` takes two arguments, a function, and args, which may be any value that can be handled by JSON.stringify. Numbers, booleans, and objects/arrays should work. spawn will return a `RemoteReference`, which is essentially to a pointer to the result of your function, but on a different processor. To get the result of the computation, you can call fetch on the remote reference.

### Examples

Take the trivial case of returning the square root of a number:

```javascript
// Spawn a remote RemoteReference
var r = Parallel.spawn(Math.sqrt, 100);
 
// Fetch the remote reference and log the result when it's complete
r.fetch(function (result) {
    console.log(result);
});
```

This example computes the square root of 100 by spawning a worker on another core. We then "fetch" the result of this computation. Since the result may not be ready when we call `fetch` (think a long-running computation), we pass a callback that will receive the result of the computation when the job is complete. fetch may also be called without the callback and will return the result if it is ready, otherwise it will return `undefined`.

What might it look like if we spawn a longer running job?

```javascript
var slowSquare = function (n) { 
    var i = 0; 
    while (++i < n * n) {}
    return i; 
};
 
// Spawn a remote reference
var r = Parallel.spawn(slowSquare, 100000);
 
// Call back when done
r.fetch(yourCallBack);
```

## Parallel.mapreduce

`mapreduce` should be used when you want to distribute a single operation across any arbitrary number of workers, splitting the data to be processed into chunks. The number of chunks will determine how many workers will be spawned. As a rule of thumb, pass as many chunks as you have cores. Keep in mind that your processer may allow multiple threads per core. In that case, multiply the number of threads by the number of cores and pass that many chunks. This function will return a DistributedProcess that has references to each of the spawned remote references.

`mapreduce` takes three required arguments and one optional argument.

- mapper: A function to be performed remotely on each chunk of data
- reducer: A function that will be used to combine the results from each chunk
- chunks: This is the data to be processed. Pass one chunk for each core.
- callback(optional): An optional function to fire when all cores return. This function gets the reduced results as a parameter.

### Examples

Let's start with the square root example:

```javascript
// Our mapper (need to formulate it like this to avoid the browser compiling Math.sqrt to native code)
var sqrt = function (n) { return Math.sqrt(n); };
 
// Our reducer
var add = function (a, b) { return a + b; };
 
// Get the square root of each number and sum them together
var d = Parallel.mapreduce(sqrt, add, [100, 200, 400, 600, 800]);
 
// Fetch the distributed process and get the reduced value when complete
d.fetch(function (result) {
    console.log(result);
});
```

What we do here is define our map and reduce functions, then send them to the `mapreduce` function along with a list of chunks. Each chunk will be the argument passed to `sqrt`. To pass multiple arguments to the mapper, make each chunk and array.

Once we dispatch the computation, we get a `DistributedProcess` object, d. d contains references to the mapper, reducer, chunks, and the array of remote references being used.

Finally, we call fetch on the `DistributedProcess` to get the reduced value. Since the results will not be returned immediately, we give it a callback to be fired when the process is complete.

Now let's try a longer running job:

```javascript
// Our mapper
var slowSquare = function (n) { 
    var i = 0; 
    while (++i < n * n) {}
    return i; 
};
 
// Our reducer
var add = function (a, b) { return a + b; };
 
// Get the square root of each number and sum them together
var d = Parallel.mapreduce(sqrt, add, [10000, 20000, 40000, 60000, 80000]);
 
// Fetch the distributed process and get the reduced value when complete
d.fetch(yourCallback);
```

## RemoteReference

You can think of a remote reference as a pointer, except that it points to a value on another processor. Remote references are returned from every call to spawn and are contained in a list of "refs" on every `DistributedProcess`.

Methods and properties of RemoteReference:

- fetch: Used to fetch the result of the computation. Will return the value of the RemoteReference.prototype.data or undefined if the value is not available. If a callback is specified, fetch will wait until it has a value, then call the callback with that value.
- data: The raw result of the computation. Will be undefined until the computation is complete.
- terminate: Terminate the current worker.
- onWorkerMsg: An internal function that gets called when the process is complete. May be overloaded for custom behavior.


## DistributedProcess

A distributed process corresponds to a mapreduce job. It gets references to all of the remote references so you can keep track of each individually. It also implements methods for getting the results.

Methods and properties of DistributedProcess:

- fetch: Used to fetch the result of the computation. Will return the value of the RemoteReference.prototype.data or undefined if the value is not available. If a callback is specified, fetch will wait until it has a value, then call the callback with that value.
- fetchRefs: Fetches each remote reference individually and returns an array of the results. Optionally pass a callback that will be sent to the remote reference's fetch method.
- terminate: Terminate the worker specifed by optional argument, n. n must be an integer. If n is not passed, all workers will be terminated.
- onWorkerMsg: An internal function that gets called when the process is complete. May be overloaded for custom behavior.