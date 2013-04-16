var isNode = typeof module !== 'undefined' && module.exports;

if (isNode) {
	process.once('message', function (code) {
		eval(code);
	});
} else {
	self.onmessage = function (code) {
		eval(code);
	};
}