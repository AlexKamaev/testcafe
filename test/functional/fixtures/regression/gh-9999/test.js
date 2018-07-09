var expect = require('chai').expect;

describe.only('[Regression](GH-9999)', function () {
    it('9999', function () {
        return runTests('./testcafe-fixtures/index.js', '123', { shouldFail: true })
            .catch(function (errs) {
                expect(errs[0]).to.contains('Unhandled promise rejection');
            });
    });

    it.only('9999', function () {
        let unhandledRejectionRaised = false;

        process.once('unhandledRejection', err => {
            unhandledRejectionRaised = true;

            expect(err.message).eql('reject');
        });

        return runTests('./testcafe-fixtures/index.js', '123', { ignoreUncaughtErrors: true })
            .then(() => {
                expect(unhandledRejectionRaised).eql(true);
            });
    });
});
