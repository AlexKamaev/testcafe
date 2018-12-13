'use strict';

import fs from 'fs';
import path from 'path';
import Module from 'module';
import TestRunController from './test-run-controller';
import Controller from './controller';
import Runner from '../runner';
import Promise from 'pinkie';
import Bootstrapper from '../runner/bootstrapper';

const CLIENT_JS       = fs.readFileSync(path.join(__dirname, './client/index.js'));
const originalRequire = Module.prototype.require;

class BootstrapperLive extends Bootstrapper {
    constructor (runner, browserConnectionGateway) {
        super(browserConnectionGateway);

        this.runner = runner;
    }

    _getTestsAndFiles () {
        this._mockRequire();

        return super._getTestsAndFiles()
            .then(result => {
                this._restoreRequire();

                return result;
            });
    }

    _mockRequire () {
        const runner = this.runner;

        Module.prototype.require = function (filePath) {
            const filename = Module._resolveFilename(filePath, this, false);

            if (path.isAbsolute(filename) || /^\.\.?[/\\]/.test(filename))
                runner.emit(runner.REQUIRED_MODULE_FOUND_EVENT, { filename });

            return originalRequire.apply(this, arguments);
        };
    }

    _restoreRequire () {
        Module.prototype.require = originalRequire;
    }
}

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
                        path: '/testcafe-live-test.js',
                        info: { content: CLIENT_JS, contentType: 'application/x-javascript' }
                    }
                ]
            });

        this.controller = this._createController();
    }

    _createBootstrapper (browserConnectionGateway) {
        return new BootstrapperLive(this, browserConnectionGateway);
    }

    _createController () {
        return new Controller(this);
    }

    _waitInfinite () {
        return new Promise(() => {});
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
        if (this.configuration) {
            return this.bootstrapper._getTestsAndFiles()
                .then(({ tests }) => {
                    this.configuration.tests = tests;

                    return this.configuration;
                });
        }

        return super.createRunnableConfiguration()
            .then(configuration => {
                this.configuration = configuration;

                return configuration;
            });
    }

    run (options) {
        this.opts = Object.assign({}, this.opts, options);

        return this.createRunnableConfiguration()
            .then(({ files }) => this.controller.init(files))
            .then(() => {
                return this._runTests();
            })
            .then(() => {
                return this._waitInfinite();
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
