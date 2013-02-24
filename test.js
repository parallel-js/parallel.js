Parallel = require('./parallel');

// Need to do it like this to avoid premature browser compilation of Math.sqrt
var sqrt = function (n) { return Math.sqrt(n); };
 
// Spawn a remote RemoteReference
var r = Parallel.spawn(sqrt, 100);
 
// Fetch the remote reference and log the result when it's complete
r.fetch(function (result) {
    console.log(result);
});