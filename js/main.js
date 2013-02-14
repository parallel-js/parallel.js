$(function () {
    prettyPrint();


    $('#example-2 .btn').click(function () {
        var that = this;

        var slowSquare = function (n) { 
            var i = 0; 
            while (++i < n * n) {}
            return i; 
        };

        var check = function () {
            if (!r.fetch()) {
                $(that).siblings('.result').html('Computation started: ' + Math.floor((Date.now() - start) / 1000) + 's ago');
            } else {
                return $(that).siblings('.result').html('Result is: ' + r.fetch() + '. Computed in: ' + Math.floor((Date.now() - start) / 1000) + ' seconds.');
            }

            setTimeout(check, 1000);
        }

        var start = Date.now();
        var r = Parallel.spawn(slowSquare, 100000);

        r.fetch(check());
    });

    $('#example-3 .btn').click(function () {
        var that = this;

        var sqrt = function (n) { return Math.sqrt(n); };

        // Our reducer
        var add = function (a, b) { return a + b; }

        

        var check = function () {
            if (!d.fetch()) {
                $(that).siblings('.result').html('Computation started: ' + Math.floor((Date.now() - start) / 1000) + 's ago');
            } else {
                return $(that).siblings('.result').html('Result is: ' + d.fetch() + '. Computed in: ' + Math.floor((Date.now() - start) / 1000) + ' seconds.');
            }

            setTimeout(check, 1000);
        }

        var start = Date.now();
        var d = Parallel.mapreduce(sqrt, add, [100, 200, 400, 600, 800]);
        d.fetch(check());
    });

    $('#example-4 .btn').click(function () {
        var that = this;

        var slowSquare = function (n) { 
            var i = 0; 
            while (++i < n * n) {}
            return i; 
        };

        // Our reducer
        var add = function (a, b) { return a + b; }

        

        var check = function () {
            if (!d.fetch()) {
                $(that).siblings('.result').html('Computation started: ' + Math.floor((Date.now() - start) / 1000) + 's ago');
            } else {
                return $(that).siblings('.result').html('Result is: ' + d.fetch() + '. Computed in: ' + Math.floor((Date.now() - start) / 1000) + ' seconds.');
            }

            setTimeout(check, 1000);
        }

        var start = Date.now();
        var d = Parallel.mapreduce(slowSquare, add, [10000, 20000, 40000, 60000, 80000]);
        d.fetch(check());
    });
});