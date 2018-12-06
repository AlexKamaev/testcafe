'use strict';

(function () {
    function getDriver (callback) {
        const interval = window.setInterval(() => {
            const testCafeDriver = window['%testCafeDriverInstance%'];

            if (testCafeDriver) {
                window.clearInterval(interval);
                callback(testCafeDriver);
            }
        }, 50);
    }

    // NOTE: enable interaction with a page when the last test is completed
    const UNLOCK_PAGE_FLAG = 'testcafe-live|driver|unlock-page-flag';

    // TestCafe > 0.18.5 required
    getDriver(testCafeDriver => {
        const testCafeCore = window['%testCafeCore%'];
        const hammerhead   = window['%hammerhead%'];

        testCafeDriver.setCustomCommandHandlers('unlock-page', () => {
            testCafeCore.disableRealEventsPreventing();

            testCafeDriver.contextStorage.setItem(UNLOCK_PAGE_FLAG, true);

            return hammerhead.Promise.resolve();
        });

        const chain = testCafeDriver.contextStorage ? hammerhead.Promise.resolve() : testCafeDriver.readyPromise;

        chain.then(() => {
            if (testCafeDriver.contextStorage.getItem(UNLOCK_PAGE_FLAG))
                testCafeCore.disableRealEventsPreventing();
        });
    });
})();
