describe('[Regression](GH-2056)', function () {
    it('Move actions should provide correct button, buttons, which properties', function () {
        return runTests('testcafe-fixtures/index.js');
    });
});
