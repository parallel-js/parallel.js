var isNode = module && module.exports;

if (isNode) {
	process.on('message', function (code) {
		eval(code);
	});
}