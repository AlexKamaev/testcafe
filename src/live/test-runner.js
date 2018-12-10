'use strict';

const fs                = require('fs');
const path              = require('path');
const EventEmitter      = require('events');
const TestRunController = require('./test-run-controller');

const CLIENT_JS = fs.readFileSync(path.join(__dirname, './client/index.js'));

import Promise from 'pinkie';

module.exports = class TestRunner extends EventEmitter {
    constructor (opts, runner) {
        super();

        /* EVENTS */
        this.TEST_RUN_STARTED            = 'test-run-started';
        this.TEST_RUN_DONE_EVENT         = 'test-run-done';
        this.REQUIRED_MODULE_FOUND_EVENT = 'require-module-found';

        this.opts = opts;

        this.runner = runner;

        this.stopping            = false;
        this.tcRunnerTaskPromise = null;

        this.testRunController = new TestRunController();

        this.testRunController.on(this.testRunController.RUN_STARTED_EVENT, () => this.emit(this.TEST_RUN_STARTED, {}));
    }

    _createTCRunner (runner) {
        runner
            .embeddingOptions({
                TestRunCtor: this.testRunController.TestRunCtor,
                assets:      [
                    {
                        path: '/testcafe-live.js',
                        info: { content: CLIENT_JS, contentType: 'application/x-javascript' }
                    }
                ]
            });

        runner.proxy.closeSession = () => {};

        return runner.bootstrapper
            .createRunnableConfiguration()
            .then(runnableConf => {
                const browserSet = runnableConf.browserSet;

                browserSet.dispose = () => Promise.resolve();

                runner.bootstrapper.createRunnableConfiguration = () => {
                    return Promise.resolve(runnableConf);
                };

                return { runner, runnableConf };
            });
    }

    _runTests (tcRunner) {
        return tcRunner.bootstrapper
            ._getTests()
            .then(tests => {
                this.testRunController.run(tests.filter(t => !t.skip).length);

                this.tcRunnerTaskPromise = tcRunner.run(this.opts);

                return this.tcRunnerTaskPromise;
            });
    }

    run () {
        let runError = null;

        let testRunPromise = null;

        if (!this.initialized) {

            this.initialized = true;

            testRunPromise = this
                ._createTCRunner(this.runner)
                .then(res => {
                    this.runnableConf = res.runnableConf;

                    return this._runTests(res.runner);
                })
                .catch(err => {
                    runError = err;
                });
        }
        else {
            testRunPromise = this
                ._runTests(this.runner)
                .catch(err => {
                    runError = err;
                });
        }

        return testRunPromise
            .then(() => {
                this.tcRunnerTaskPromise = null;

                this.emit(this.TEST_RUN_DONE_EVENT, { err: runError });
            });
    }

    stop () {
        if (!this.tcRunnerTaskPromise)
            return Promise.resolve();

        return new Promise(resolve => {
            this.testRunController.once(this.testRunController.RUN_STOPPED_EVENT, () => {
                this.stopping = false;
                resolve();

                this.emit(this.TEST_RUN_DONE_EVENT, {});
            });

            this.stopping = true;
            this.testRunController.stop();
            this.tcRunnerTaskPromise.cancel();
        });
    }

    exit () {
        if (this.tcRunnerTaskPromise)
            this.tcRunnerTaskPromise.cancel();

        return Promise.resolve();
    }
};
