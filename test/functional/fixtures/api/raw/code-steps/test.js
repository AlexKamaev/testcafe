const { expect } = require('chai');

describe('[Raw API] Code steps', function () {
    it('Selectors', function () {
        return runTests('./testcafe-fixtures/code-steps.testcafe', 'Selectors');
    });

    it('Shared context', function () {
        return runTests('./testcafe-fixtures/code-steps.testcafe', 'Shared context');
    });

    it('Require', function () {
        return runTests('./testcafe-fixtures/code-steps.testcafe', 'Require');
    });

    it('Error', function () {
        return runTests('./testcafe-fixtures/code-steps.testcafe', 'Error', { shouldFail: true })
            .catch(err => {
                expect(err[0]).contains(
                    'An unhandled error occurred in a step with custom JS code:  Assignment to constant variable.  ' +
                    'const q = 1; q = 2; at 2:3'
                );
            });
    });

    it('Selector not found error', function () {
        return runTests('./testcafe-fixtures/code-steps.testcafe', 'Selector not found error', { shouldFail: true })
            .catch(err => {
                expect(err[0]).contains('The specified selector does not match any element in the DOM tree');
                expect(err[0]).contains('> | Selector(\'non-existing-selector\')');
            });
    });
});
