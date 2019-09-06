const createTestCafe = require('../../../../lib');
const config         = require('../../config');
const path           = require('path');
const { expect }     = require('chai');
const helper         = require('./test-helper');

const LiveModeController            = require('../../../../lib/live/controller');
const LiveModeRunner                = require('../../../../lib/live/test-runner');
const LiveModeKeyboardEventObserver = require('../../../../lib/live/keyboard-observer');

class LiveModeKeyboardEventObserverMock extends LiveModeKeyboardEventObserver {
    _listenKeyEvents () {
    }
}

class ControllerMock extends LiveModeController {
    _createKeyboardObserver () {
        return new LiveModeKeyboardEventObserverMock();
    }
}

class RunnerMock extends LiveModeRunner {
    _createController () {
        return new ControllerMock(this);
    }
}

function createRunner (testcafe) {
    const { proxy, browserConnectionGateway, configuration } = testcafe;

    const runner = new RunnerMock(proxy, browserConnectionGateway, configuration.clone());

    testcafe.runners.push(runner);

    return runner;
}

let testcafe   = null;
let liveRunner = null;


if (config.useLocalBrowsers && !config.useHeadlessBrowsers) {
    describe.only('Live', () => {
        it('Smoke', () => {
            const browsers = ['chrome', 'firefox'];
            const runCount = 2;

            return createTestCafe('127.0.0.1', 1335, 1336)
                .then(tc => {
                    testcafe = tc;
                })
                .then(() => {
                    liveRunner = createRunner(testcafe);

                    const fixturePath = path.join(__dirname, '/testcafe-fixtures/smoke.js');

                    helper.watcher.once('test-complete', () => {
                        setTimeout(() => {
                            liveRunner.controller._restart()
                                .then(() => {
                                    liveRunner.exit();
                                });
                        }, 1000);
                    });

                    return liveRunner
                        .src(fixturePath)
                        .browsers(browsers)
                        .run();
                })
                .then(() => {
                    expect(helper.counter).eql(browsers.length * helper.testCount * runCount);

                    return testcafe.close();
                });
        });

        it('Same runner stops runs again with other settings', function () {
            let finishTest = null;

            const promise = new Promise(resolve => {
                finishTest = resolve;
            });


            createTestCafe('localhost', 1337, 1338)
                .then(tc => {
                    testcafe   = tc;
                    liveRunner = createRunner(testcafe);

                    setTimeout(() => {
                        return liveRunner.stop()
                            .then(() => {
                                const fixturePath = path.join(__dirname, '/testcafe-fixtures/test-2.js');

                                helper.watcher.once('test-complete', () => {
                                    liveRunner.exit();
                                });

                                return liveRunner
                                    .browsers(['firefox'])
                                    .src(fixturePath)
                                    .run()
                                    .then(() => {
                                        return testcafe.close();
                                    })
                                    .then(() => {
                                        finishTest();
                                    });
                            });
                    }, 10000);

                    const fixturePath = path.join(__dirname, '/testcafe-fixtures/test-1.js');

                    return liveRunner
                        .src(fixturePath)
                        .browsers(['chrome'])
                        .run();
                });

            return promise;
        });
    });
}
