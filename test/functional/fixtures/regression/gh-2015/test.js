describe('[Regression](GH-2015)', function () {
    it('Should restore local storage state on useRole', function () {
        return runTests('./testcafe-fixtures/index.js');
    });
});


