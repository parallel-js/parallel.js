describe('Parallel', function() {
    it('should be a function', function() {
        expect(Parallel).toEqual(jasmine.any(Function));
    });
    
    it('should define a .spawn function', function() {
       expect(Parallel(1).spawn).toEqual(jasmine.any(Function));
    });
    
    it('should define a .map function', function() {
       expect(Parallel(1).map).toEqual(jasmine.any(Function));
    });
    
    it('should define a .reduce function', function() {
       expect(Parallel(1).reduce).toEqual(jasmine.any(Function));
    });
    
    it('should define a .then function', function() {
       expect(Parallel(1).then).toEqual(jasmine.any(Function));
    });
    
    it('should throw without given data', function() {
        expect(Parallel.bind(this)).toThrow(); 
    });
    
    it('should execute map correctly', function() {
        var p = Parallel([1, 2, 3]);
        var done = false;
        
        runs(function() {
           p.map(function(a) {return a * a;}).then(function(values) {
               done = true;
               expect(values.length).toEqual(3);
               expect(values).toContain(1);
               expect(values).toContain(4);
               expect(values).toContain(9);
           });
        });
        waitsFor(function() {
            return done;
        }, "it should finish", 500);
    });
    
    it('should execute reduce correctly', function() {
        var p = Parallel([1, 2, 3]);
        var done = false;
        
        runs(function() {
            p.reduce(function(a, b) {return a + b;}).then(function(value) {
                done = true;
                
                expect(value).toEqual(6);
            });
        });
        waitsFor(function() {
            return done;
        }, "it should finish", 500);
    });
    
    it('should map-reduce correctly', function() {
        var p = Parallel([1, 2, 3]);
        var done = false;
        
        runs(function() {
            p.map(function(a) {return a * a;}).
            reduce(function(a, b) {return a+b;}).then(function(value) {
                done = true;
                
                expect(value).toEqual(14);
            });
        });
        waitsFor(function() {
            return done;
        }, "it should finish", 500);
    });
    
    it('should call .then even if no operation ran', function() {
        var p = Parallel([1, 2, 3]);
        var done = false;
        
        runs(function() {
            p.then(function() {
                done = true;
            });
        });
        waitsFor(function() {
            return done;
        }, "it should finish", 500);
    });
    
    it('should continue mapping after adding a second step', function() {
        var p = Parallel([1, 2, 3]);
        var done = false;
        
        runs(function() {
            p.map(function(a) {return a;}).then(function() {
                p.map(function(a) {return a;}).then(function() {
                    done = true;
                });
            });
        });
        waitsFor(function() {
            return done;
        }, "it should finish", 500);
    });
});
