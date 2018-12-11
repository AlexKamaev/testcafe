'use strict';

const EventEmitter = require('events');
const FileWatcher  = require('./file-watcher');
const logger       = require('./logger');
const process      = require('process');

const exitHook = require('async-exit-hook');
const keypress = require('keypress');

import Promise from 'pinkie';

export default class Controller extends EventEmitter {
    constructor (runner) {
        super();

        this.REQUIRED_MODULE_FOUND_EVENT = 'require-module-found';

        this.testRunner = null;
        this.src        = null;

        this.running        = false;
        this.restarting     = false;
        this.watchingPaused = false;
        this.stopping       = false;

        this.testRunner = runner;
    }

    init (files) {
        exitHook(cb => {
            this.exit()
                .then(cb);
        });

        // Listen commands
        keypress(process.stdin);

        process.stdin.on('keypress', (ch, key) => {
            if (key && key.ctrl) {
                if (key.name === 's')
                    return this.stop();

                else if (key.name === 'r')
                    return this.restart();

                /* eslint-disable no-process-exit */
                else if (key.name === 'c')
                    return this.exit().then(() => process.exit(0));
                /* eslint-enable no-process-exit */

                else if (key.name === 'w')
                    return this.toggleWatching();
            }

            return null;
        });

        if (process.stdout.isTTY)
            process.stdin.setRawMode(true);


        this._initFileWatching(files);

        // this.testRunner.opts = tcArguments.opts;

        this.testRunner.on(this.testRunner.TEST_RUN_STARTED, () => logger.testsStarted());

        this.testRunner.on(this.testRunner.TEST_RUN_DONE_EVENT, e => {
            this.running = false;
            if (!this.restarting)
                logger.testsFinished();

            /* eslint-disable no-console */
            if (e.err)
                console.log(`ERROR: ${e.err}`);
            /* eslint-enable no-console */
        });

        this.testRunner.on(this.testRunner.REQUIRED_MODULE_FOUND_EVENT, e => {
            this.emit(this.REQUIRED_MODULE_FOUND_EVENT, e);
        });

        return Promise.resolve()
            .then(() => logger.intro(files));
            // .then(() => this._runTests());
    }

    _initFileWatching (src) {
        const fileWatcher = new FileWatcher(src);

        this.on(this.REQUIRED_MODULE_FOUND_EVENT, e => fileWatcher.addFile(e.filename));

        fileWatcher.on(fileWatcher.FILE_CHANGED_EVENT, () => this._runTests(true));
    }

    _runTests (sourceChanged) {
        if (this.watchingPaused || this.running)
            return Promise.resolve();

        this.running    = true;
        this.restarting = false;

        logger.runTests(sourceChanged);

        return this.testRunner._runTests();
    }

    toggleWatching () {
        this.watchingPaused = !this.watchingPaused;

        logger.toggleWatching(!this.watchingPaused);
    }

    stop () {
        if (!this.testRunner || !this.running) {
            logger.nothingToStop();

            return Promise.resolve();
        }

        logger.stopRunning();

        return this.testRunner.stop()
            .then(() => {
                this.restarting = false;
                this.running    = false;
            });
    }

    restart () {
        if (this.restarting)
            return Promise.resolve();

        console.log('restart');

        this.restarting = true;
        if (this.running) {
            return this.stop()
                .then(() => logger.testsFinished())
                .then(() => this._runTests());
        }

        return this._runTests();
    }

    exit () {
        if (this.stopping)
            return Promise.resolve();

        logger.exit();

        this.stopping = true;

        return this.testRunner ? this.testRunner.exit() : Promise.resolve();
    }


}
