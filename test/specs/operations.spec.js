describe('Operations', function () {
    var isNode = typeof module !== 'undefined' && module.exports;
    var Parallel = isNode ? require('../../lib/parallel.js') : self.Parallel;

    it('should require(), map() and reduce correctly (check console errors)', function () {
    	var p = new Parallel([0, 1, 2, 3, 4, 5, 6, 7, 8], { evalPath: isNode ? undefined : 'lib/eval.js' });

        function add(d) { return d[0] + d[1]; }
        function factorial(n) { return n < 2 ? 1 : n * factorial(n - 1); }

        p.require(factorial);

        var done = false;
        runs(function () {
            p.map(function (n) { return Math.pow(10, n); }).reduce(add).then(function() {
                done = true;
            });
        });

        waitsFor(function () {
            return done;
        }, "it should finish", 500);
    });
});