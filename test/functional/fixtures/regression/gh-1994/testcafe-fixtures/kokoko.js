var v8 = require('v8-natives');

let foo = function () {
    const bar = 1;

    (function() {
        debugger;
    })();

    eval('');
}

debugger;

// v8.neverOptimizeFunction(foo);

v8.deoptimizeFunction(foo);

foo();


