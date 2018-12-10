'use strict';

const fs                = require('fs');
const path              = require('path');
const TestRunController = require('./test-run-controller');

import Runner from '../runner';

const CLIENT_JS = fs.readFileSync(path.join(__dirname, './client/index.js'));

import Promise from 'pinkie';

module.exports = class LiveRunner extends Runner {
    constructor (proxy, browserConnectionGateway, options) {
        super(proxy, browserConnectionGateway, options);

        /* EVENTS */
        this.TEST_RUN_STARTED            = 'test-run-started';
        this.TEST_RUN_DONE_EVENT         = 'test-run-done';
        this.REQUIRED_MODULE_FOUND_EVENT = 'require-module-found';

        this.opts = options;

        this.stopping            = false;
        this.tcRunnerTaskPromise = null;

        this.testRunController = new TestRunController();

        this.testRunController.on(this.testRunController.RUN_STARTED_EVENT, () => this.emit(this.TEST_RUN_STARTED, {}));

        this.proxy.closeSession = () => { };

        this
            .embeddingOptions({
                TestRunCtor: this.testRunController.TestRunCtor,
                assets:      [
                    {
                        path: '/testcafe-live.js',
                        info: { content: CLIENT_JS, contentType: 'application/x-javascript' }
                    }
                ]
            });
    }

    _runTests () {
        return this.bootstrapper
            ._getTests()
            .then(tests => {
                this.testRunController.run(tests.filter(t => !t.skip).length);

                this.tcRunnerTaskPromise = super.run(this.opts);

                return this.tcRunnerTaskPromise;
            });
    }

    _disposeBrowserSet () {
        return Promise.resolve();
    }

    createRunnableConfiguration () {
        if (this.configuration)
            return Promise.resolve(this.configuration);

        return super.createRunnableConfiguration()
            .then(configuration => {
                this.configuration = configuration;

                return configuration;
            });
    }

    run () {
        let runError = null;

        let testRunPromise = null;

        if (!this.initialized) {

            this.initialized = true;

            testRunPromise = Promise.resolve()
                .then(() => {
                    return this._runTests();
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
