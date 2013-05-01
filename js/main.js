$(function () {
	prettyPrint();


	$('#example-2 .btn').click(function () {
		var that = this;

		var slowSquare = function (n) {
			var i = 0;
			while (++i < n * n) { }
			return i;
		};

		var to;

		var check = function (val) {
			if (!done) {
				$(that).siblings('.result').html('Computation started: ' + Math.floor((Date.now() - start) / 1000) + 's ago');
			} else {
				clearTimeout(to);
				return $(that).siblings('.result').html('Result is: ' + val + '. Computed in: ' + Math.floor((Date.now() - start) / 1000) + ' seconds.');
			}

			to = setTimeout(check, 1000);
		};

		var start = Date.now();
		var p = new Parallel(100000, { evalPath: 'js/eval.js' }),
            done = false;

		p.spawn(slowSquare).then(function (result) {
			done = true;
			check(result)
		});

		check();
	});

	$('#example-3 .btn').click(function () {
		var that = this;

		function fib(n) {
			return n < 2 ? 1 : fib(n - 1) + fib(n - 2);
		};


		var to;

		var check = function (val) {
			if (!done) {
				$(that).siblings('.result').html('Computation started: ' + Math.floor((Date.now() - start) / 1000) + 's ago');
			} else {
				clearTimeout(to);
				return $(that).siblings('.result').html('Result is: [' + val.join(', ') + ']. Computed in: ' + Math.floor((Date.now() - start) / 1000) + ' seconds.');
			}

			to = setTimeout(check, 1000);
		};

		var start = Date.now();
		var p = new Parallel([0, 1, 2, 3, 4, 5, 6], { evalPath: 'js/eval.js' }),
            done = false;

		p.map(fib).then(function (res) {
			done = true;
			check(res);
		});

		check();
	});

	$('#example-4 .btn').click(function () {
		var that = this;

		function fib(n) {
			return n < 2 ? 1 : fib(n - 1) + fib(n - 2);
		};


		var to;

		var check = function (val) {
			if (!done) {
				$(that).siblings('.result').html('Computation started: ' + Math.floor((Date.now() - start) / 1000) + 's ago');
			} else {
				clearTimeout(to);
				return $(that).siblings('.result').html('Result is: [' + val.join(', ') + ']. Computed in: ' + Math.floor((Date.now() - start) / 1000) + ' seconds.');
			}

			to = setTimeout(check, 1000);
		};

		var start = Date.now();
		var p = new Parallel([40, 41, 42], { evalPath: 'js/eval.js' }),
            done = false;

		p.map(fib).then(function (res) {
			done = true;
			check(res);
		});

		check();
	});

	$('#example-5 .btn').click(function () {
		var that = this;

		function fib(n) {
			return n < 2 ? 1 : fib(n - 1) + fib(n - 2);
		};


		var to;

		var check = function (val) {
			if (!done) {
				$(that).siblings('.result').html('Computation started: ' + Math.floor((Date.now() - start) / 1000) + 's ago');
			} else {
				clearTimeout(to);
				return $(that).siblings('.result').html('Result is: ' + val + '. Computed in: ' + Math.floor((Date.now() - start) / 1000) + ' seconds.');
			}

			to = setTimeout(check, 1000);
		};

		var start = Date.now();

		var p = new Parallel(_.range(50), { evalPath: 'js/eval.js' }),
            done = false;

		function add(d) { return d[0] + d[1]; }
		function factorial(n) { return n < 2 ? 1 : n * factorial(n - 1); }
		function log() { console.log(arguments); }

		p.require(factorial)

		// Approximate e^10
		p.map(function (n) { return Math.pow(10, n) / factorial(n); }).reduce(add).then(function (res) {
			done = true;
			check(res);
		});

		check();
	});
});