const path           = require('path');
const createTestCafe = require('../../../../../lib');
const config         = require('../../../config');

const LiveModeController            = require('../../../../../lib/live/controller');
const LiveModeRunner                = require('../../../../../lib/live/test-runner');
const LiveModeKeyboardEventObserver = require('../../../../../lib/live/keyboard-observer');

function createRunner (testcafe) {
    const { proxy, browserConnectionGateway, configuration } = testcafe;

    const runner = new RunnerMock(proxy, browserConnectionGateway, configuration.clone());

    testcafe.runners.push(runner);

    return runner;
}

class RunnerMock extends LiveModeRunner {
    _createController () {
        return new ControllerMock(this);
    }
}

class ControllerMock extends LiveModeController {
    _createKeyboardObserver () {
        return new LiveModeKeyboardEventObserverMock();
    }
}

class LiveModeKeyboardEventObserverMock extends LiveModeKeyboardEventObserver {
    _listenKeyEvents () {
    }
}

let testcafe   = null;
let liveRunner = null;

if (config.useLocalBrowsers && !config.useHeadlessBrowsers) {
    describe('', function () {
        it('test', function () {
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

                                setTimeout(() => {
                                    liveRunner.stop();
                                }, 10000);

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
                        .run()
                });

            return promise;
        });
    });


}


