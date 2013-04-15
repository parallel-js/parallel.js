(function () {
	var isNode = module !== undefined && module.exports;
	
	function Parallel() {

	}

	if (isNode) {
		module.exports = Parallel;
	} else {
		self.Parallel = Parallel;
	}
})();