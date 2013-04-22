thread.js
===

Parallel Computing with Javascript
---

thread.js allows you to spawn webworkers without any hassle in node.js and in the webbrowser.
The API is really simple:

### API
#### var thread = new Thread(data, opts)
This initializes a new thread.js instance (note: not a webworker). ```data``` is any data you want to work with in your operations.
In node.js data has to be ```JSON.serialize()```able, in a webbrowser, the object you want to transmit, has to be a transferable.

The following options are available:

* path

  default value: ```(isNode ? __dirname + '/' : '') + 'eval.js'```
  

  This is the path to the eval.js file on your webserver (webbrowser-only).
  
* maxWorkers

  default value: ```isNode ? require('os').cpus().length : 4```

  The maximum of threads you want to use simultaneously.

Note that every function call returns a promise!

#### .spawn(fn)
```.spawn``` spawns a single webworker with your given function as an argument.
The function will receive one parameter with the data which is currently held by the thread.js instance.
The value returned from spawn will be stored in the thread.js instance after execution in the worker.

#### .map(fn)
```.map``` spawns one worker per element in the ```data```-array up to the given ```maxWorkers``` option.
The function given to map will receive a single element of the array and the returned value will be stored at that index of the array again.

#### .then(success, fail)
The functions given to ```.then``` are called after the last requested operation has finished.
```success``` receives the resulting data object, while ```fail``` will receive an error object.

### Code Style

Code style is equivalent to the Visual Studio default code formatting settings, namely:

* Tabs
* when using anonymous functions, put a space between function and the paranthesis ```function () {```
* no spaces around parameters, only after commas
* Use semilicons
* no newline before curly braces
* single quotes for strings
* tests, tests, tests. If you change something and it's testable, there **has** to be a test
