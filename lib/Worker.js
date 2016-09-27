var loadWebworker = function(){
  var supported = function(){
    var semverArray = webworkerVersion.split(".")
      , major = parseInt(semverArray[0])
      , minor = parseInt(semverArray[1])
      , patch = parseInt(semverArray[2]);

      return (major < 1 && (minor > 4 || (minor === 4 && patch >= 7)));
   };

  try {
    var ret = require('webworker-threads').Worker
    var webworkerVersion = require('webworker-threads/package.json').version
  } catch (err) {
    ret = null;
  }

  if (!supported) { ret = null };
  return ret;
};

Worker = loadWebworker();
if (!Worker){
  var ps = require('child_process');

  Worker = function (url) {
    var that = this;
    this.process = ps.fork(url);
    this.process.on('message', function (msg) {
      if (that.onmessage) {
        that.onmessage({ data: JSON.parse(msg) });
      }
    });
    this.process.on('error', function (err) {
      if (that.onerror) {
        that.onerror(err);
      }
    });
  }

  Worker.isChildProcess = true;

  Worker.prototype.onmessage = null;
  Worker.prototype.onerror = null;

  Worker.prototype.postMessage = function (obj) {
    this.process.send(JSON.stringify({ data: obj }));
  };

  Worker.prototype.terminate = function () {
    this.process.kill();
  };
}

module.exports = Worker;
