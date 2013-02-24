var _ = require('underscore');

process.on('message', function (m) {
	console.log('CHILD got message:', m);
	process.send(_.map(m, Math.sqrt));
});