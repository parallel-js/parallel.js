// @flow
const ps = require('child_process');

function Worker(url: string) {
  const that = this;
  this.process = ps.fork(url);
  this.process.on('message', (msg) => {
    if (that.onmessage) {
      that.onmessage({ data: JSON.parse(msg) });
    }
  });
  this.process.on('error', (err) => {
    if (that.onerror) {
      that.onerror(err);
    }
  });
}

Worker.prototype.onmessage = null;
Worker.prototype.onerror = null;

Worker.prototype.postMessage = function postMessage(obj) {
  this.process.send(JSON.stringify({ data: obj }));
};

Worker.prototype.terminate = function terminate() {
  this.process.kill();
};

module.exports = Worker;
