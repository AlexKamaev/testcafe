'use strict';
const onetime  = require('onetime');
const exitHook = require('async-exit-hook');

module.exports = onetime(() => {
    exitHook(() => {
        process.stderr.write('\u001b[?25h');
    });
});
