/*
 *  Library: parallel.js
 *  File: worker.js - a polyfill for Node so we can have Workers
 *  Author: Adam Savitzky
 *  License: Creative Commons 3.0
 *  Note: Only used for node implementation
 */

// Dependencies
{
    var childProcess = require('child_process'),
        fork = childProcess.fork;
}

// ChildProcess
{
    var ChildProcess = function (parent, path) {
        var that = this,
            process = fork(path);

        this.on = function (event, fn) {
            process.on(event, fn);
        }

        return process;
    };
}

// Worker
{
    var Worker = function (path) {
        this.process = new ChildProcess(this, path);
    };

    Worker.prototype.onmessage = null;

    Object.__defineSetter__.call(Worker.prototype, 'onmessage', function (fn) {
        this.process.on('message', fn);
    });

    Worker.prototype.onerror = null;

    Object.__defineSetter__.call(Worker.prototype, 'onerror', function (fn) {
        this.process.on('error', fn);
    });

    Worker.prototype.postMessage = function (msg) {
        this.process.send(msg);
    };

    Worker.prototype.terminate = function () {
        this.process.disconnect();
    };
}

module.exports = Worker;