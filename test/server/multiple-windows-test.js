const expect              = require('chai').expect;
const TestRun             = require('../../lib/test-run');
const TestController      = require('../../lib/api/test-controller');
const { TEST_RUN_ERRORS } = require('../../lib/errors/types');

class TestRunMock extends TestRun {
    constructor () {
        super({ id: 'test-id', name: 'test-name', fixture: { path: 'dummy', id: 'fixture-id', name: 'fixture-name' } }, {}, {}, {}, {});

        this.browserConnection = {
            activeWindowId: 'id'
        };
    }

    _addInjectables () {
    }

    _initRequestHooks () {
    }
}

describe('Multiple windows', () => {
    it('Not allowed in Legacy', async () => {
        const testRun        = new TestRunMock();
        const testController = new TestController(testRun);

        testRun.test.isLegacy = true;

        try {
            await testController.openWindow('http://example.com');
        }
        catch (err) {
            expect(err.code).eql(TEST_RUN_ERRORS.allowMultipleWindowsOptionIsNotSpecifiedError);
        }
    });

    it('Not allowed in Remote', async () => {
        const testRun        = new TestRunMock();
        const testController = new TestController(testRun);

        testRun.browserConnection.activeWindowId = null;

        try {
            await testController.openWindow('http://example.com');
        }
        catch (err) {
            expect(err.code).eql(TEST_RUN_ERRORS.allowMultipleWindowsOptionIsNotSpecifiedError);
        }
    });
});
