var ps = require('child_process');

function Worker(url) {
	var that = this;
	this.process = ps.fork(__dirname + '/eval.js');
	this.process.on('message', function (msg) {
		if (that.onmessage) {
			that.onmessage(msg);
		}
	});
	this.process.on('error', function (err) {
		if (that.onerror) {
			that.onerror(err);
		}
	});
}

Worker.prototype.onmessage = null;
Worker.prototype.onerror = null;

Worker.prototype.postMessage = function (obj) {
	this.process.send(obj);
};

Worker.prototype.terminate = function () {
	this.process.kill();
};

module.exports = Worker;