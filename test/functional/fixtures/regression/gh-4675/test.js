const path           = require('path');
const expect         = require('chai').expect;
const createTestCafe = require('../../../../../lib');
const config         = require('../../../config.js');

const reporter = {
    name: 'custom',
    reportTestDone () { },
    reportFixtureStart () { },
    reportTaskStart () {
        this.write('');
    },
    reportTaskDone () { }
};

function customReporter () {
    return reporter;
}

let testCafe = null;

if (config.useLocalBrowsers) {
    describe('[Regression](GH-4675) - Should raise an error if several reporters are going to write to the stdout', function () {
        it('Should raise an error if several reporters are going to write to the stdout', function () {
            let error = null;

            return createTestCafe('127.0.0.1', 1335, 1336)
                .then(tc => {
                    testCafe = tc;
                })
                .then(() => {
                    return testCafe.createRunner()
                        .browsers(`chrome`)
                        .src(path.join(__dirname, './testcafe-fixtures/index.js'))
                        .reporter([customReporter, customReporter])
                        .run();
                })
                .catch(err => {
                    error = err;

                    return testCafe.close();
                })
                .finally(() => {
                    expect(error.message).eql('Multiple reporters attempting to write to stdout: "custom, custom". Only one reporter can write to stdout.');
                });
        });
    });
}
