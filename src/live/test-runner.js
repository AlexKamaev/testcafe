'use strict';

import fs from 'fs';
import path from 'path';
import TestRunController from './test-run-controller';
import Controller from './controller';
import Runner from '../runner';
import Promise from 'pinkie';

const CLIENT_JS = fs.readFileSync(path.join(__dirname, './client/index.js'));

class LiveRunner extends Runner {
    constructor (proxy, browserConnectionGateway, options) {
        super(proxy, browserConnectionGateway, options);

        /* EVENTS */
        this.TEST_RUN_STARTED            = 'test-run-started';
        this.TEST_RUN_DONE_EVENT         = 'test-run-done';
        this.REQUIRED_MODULE_FOUND_EVENT = 'require-module-found';

        this.stopping            = false;
        this.tcRunnerTaskPromise = null;

        this.testRunController = new TestRunController();

        this.testRunController.on(this.testRunController.RUN_STARTED_EVENT, () => this.emit(this.TEST_RUN_STARTED, {}));

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

        this.controller = new Controller(this);
    }

    _runTests () {
        let runError = null;

        this.testRunController.run(this.configuration.tests.filter(t => !t.skip).length);

        this.tcRunnerTaskPromise = super.run(this.opts);

        return this.tcRunnerTaskPromise.catch(err => {
            runError = err;
        })
            .then(() => {
                this.tcRunnerTaskPromise = null;

                this.emit(this.TEST_RUN_DONE_EVENT, { err: runError });
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

    run (options) {
        this.opts = options;

        return this.createRunnableConfiguration()
            .then(({ files }) => this.controller.init(files))
            .then(() => {
                return this._runTests();
            })
            .then(() => {
                return new Promise(() => {});
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
}

export default LiveRunner;
