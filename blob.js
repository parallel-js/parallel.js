/*
 *  Library: parallel.js
 *  File: blob.js - a polyfill for Node so we can have Blob
 *  Author: Adam Savitzky
 *  License: Creative Commons 3.0
 *  Note: Only used for node implementation
 */

var Blob = function (arr, options) {
    this.arr = arr;
    this.type = options && options.type || undefined;
};

Blob.prototype = {

    get size() {
        return this.value.length;
    },

    get value() {
        return this.arr.join('');
    }

}

module.exports = Blob;