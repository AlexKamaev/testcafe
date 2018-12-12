const expect         = require('chai').expect;
const resolve        = require('path').resolve;
const assertAPIError = require('./helpers/assert-error').assertAPIError;
const compile        = require('./helpers/compile');
const process        = require('process');
const Promise        = require('pinkie');
const path           = require('path');
const createTestCafe = require('../../lib/index');
const LiveRunner     = require('../../lib/live/test-runner');
const Controller     = require('../../lib/live/controller');

const fileName1 = path.resolve('test/server/data/test-suites/live/testfile1.js');
const fileName2 = path.resolve('test/server/data/test-suites/live/testfile2.js');
const fileName3 = path.resolve('test/server/data/test-suites/live/testfile3.js');

class ControllerMock extends Controller {
    constructor (runner) {
        super(runner);
    }

    _listenKeyPress () {
    }

    _initFileWatching () {
    }
}

class RunnerMock extends LiveRunner {
    constructor ({ proxy, browserConnectionGateway }) {
        super(proxy, browserConnectionGateway);

        this.runCount = 0;
    }

    _createController () {
        return new ControllerMock(this);
    }

    _waitInfinite () {
        return Promise.resolve();
    }

    _runTask () {
        return Promise.resolve();
    }

    _createCancelablePromise (promise) {
        return promise;
    }

    _runTests () {
        this.runCount++;

        return super._runTests();
    }

    clearSources () {
        this.bootstrapper.sources = [];
    }
}

describe.only('fixture', function () {
    let testCafe = null;
    let runner   = null;

    before(function () {
        return createTestCafe('127.0.0.1', 1335, 1336)
            .then(function (tc) {
                testCafe = tc;

                return new RunnerMock(testCafe);
            })
            .then(function (testRunner) {
                runner = testRunner;

                return runner
                    .src(fileName1)
                    .browsers('chrome')
                    .run();
            })
            .then(() => {
                expect(runner.runCount).eql(1);
            });
    });

    after(function () {
        return testCafe.close();
    });

    beforeEach(function () {
        runner.runCount = 0;
    });

    it('run', function () {
        expect(runner.runCount).eql(0);

        const { tests, files } = runner.configuration;

        expect(tests.length).eql(1);
        expect(tests[0].name).eql('test1');
        expect(files).eql([fileName1]);
    });

    it('rerun', function () {
        expect(runner.runCount).eql(0);

        return runner.controller.restart()
            .then(() => {
                expect(runner.runCount).eql(1);
            });
    });

    it('rerun and add file', function () {
        expect(runner.runCount).eql(0);

        runner.src(fileName2);

        return runner.controller.restart()
            .then(() => {
                expect(runner.runCount).eql(1);

                const tests = runner.configuration.tests;

                expect(tests.length).eql(3);
                expect(tests[0].name).eql('test1');
                expect(tests[1].name).eql('test2');
                expect(tests[2].name).eql('test3');
            });
    });

    it('rerun uncompilable', function () {
        expect(runner.runCount).eql(0);

        runner.src(fileName3);

        const prevTests = [...runner.configuration.tests];

        return runner.controller.restart()
            .then(() => {
                expect(runner.runCount).eql(1);
                expect(runner.configuration.tests).eql(prevTests);
            })
            .then(() => {
                runner.clearSources();
                runner.src(fileName1);

                return runner.controller.restart();
            })
            .then(() => {
                expect(runner.configuration.tests).not.equal(prevTests);
                expect(runner.runCount).eql(2);

                const tests = runner.configuration.tests;

                expect(tests.length).eql(1);
                expect(tests[0].name).eql('test1');
            });
    });
});
