describe('Regression tests', function () {
	var isNode = typeof module !== 'undefined' && module.exports;
	var Worker = isNode ? require(__dirname + '/../../lib/Worker.js') : self.Worker;

	if (!isNode) {
		it('should be possible to use XmlHttpRequest', function () {
			var done = false;
			var p = new Parallel(['http://' + window.location.host + window.location.pathname], { evalPath: isNode ? undefined : 'lib/eval.js' });

			runs(function () {

				p.map(function (url) {
					var xhr = new XMLHttpRequest();
					xhr.open('GET', url, false);
					xhr.send(null);
				}).then(function () {
					done = true;
				});
			});


			waitsFor(function () {
				return done;
			}, "The request should succeed", 750);
		});
	}
});