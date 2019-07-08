describe('[Raw API] Code steps', function () {
    it('Basic', function () {
        return runTests('./testcafe-fixtures/code-steps.testcafe', 'Basic');
    });

    it('Shared context', function () {
        return runTests('./testcafe-fixtures/code-steps.testcafe', 'Shared context');
    });

    it('Require', function () {
        return runTests('./testcafe-fixtures/code-steps.testcafe', 'Require');
    });
});
