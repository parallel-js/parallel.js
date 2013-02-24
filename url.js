/*
 *  Library: parallel.js
 *  File: url.js - a polyfill for Node so we can URL.createObjectURL
 *  Author: Adam Savitzky
 *  License: Creative Commons 3.0
 *  Note: Only used for node implementation
 */

var FILE = __dirname + 'tmp/file.js';

var URL = {
	createObjectURL: function (str) {
		fs.writeFileSync(FILE, str);

		return FILE;
	}
};

module.exports = URL;