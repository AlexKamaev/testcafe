'use strict';

const exitHook   = require('async-exit-hook');
const keypress   = require('keypress');
const controller = require('./controller');
const globby     = require('globby');


export default function (testCafe, tcArguments, runner) {

    exitHook(cb => {
        controller.exit()
            .then(cb);
    });

    globby(tcArguments.src)
        .then(resolvedFiles => {
            tcArguments.resolvedFiles = resolvedFiles;
        })
        .then(() => controller.init(testCafe, tcArguments, runner));


    // Listen commands
    keypress(process.stdin);

    process.stdin.on('keypress', (ch, key) => {
        if (key && key.ctrl) {
            if (key.name === 's')
                return controller.stop();

            else if (key.name === 'r')
                return controller.restart();

            /* eslint-disable no-process-exit */
            else if (key.name === 'c')
                return controller.exit().then(() => process.exit(0));
            /* eslint-enable no-process-exit */

            else if (key.name === 'w')
                return controller.toggleWatching();
        }

        return null;
    });

    if (process.stdout.isTTY)
        process.stdin.setRawMode(true);
}
