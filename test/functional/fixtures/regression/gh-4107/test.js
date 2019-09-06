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
    describe.only('', function () {
        it('test', function () {
            let resolve = null;

            const promise = new Promise(_ => {
                resolve = _;
            });


            createTestCafe('localhost', 1337, 1338)
                .then(tc => {
                    testcafe   = tc;
                    liveRunner = createRunner(testcafe);

                    setTimeout(() => {



                        return liveRunner.stop()
                            .then(() => {
                                const fixturePath = path.join(__dirname, '/testcafe-fixtures/index2.js');

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
                                        resolve();
                                    })
                            });
                    }, 10000);

                    const fixturePath = path.join(__dirname, '/testcafe-fixtures/index.js');

                    return liveRunner
                        .src(fixturePath)
                        .browsers(['chrome'])
                        .run()
                        .then(() => {
                            // console.log('run run');
                        });
                });

            return promise;
        });
    });


}


