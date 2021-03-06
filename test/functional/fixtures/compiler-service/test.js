const path       = require('path');
const { expect } = require('chai');


describe('Compiler service', () => {
    it('Should execute a basic test', async () => {
        await runTests('testcafe-fixtures/basic-test.js', 'Basic test');
    });

    it('Should handle an error', async () => {
        try {
            await runTests('testcafe-fixtures/error-test.js', 'Throw an error', { shouldFail: true });
        }
        catch (err) {
            expect(err[0].startsWith([
                `The specified selector does not match any element in the DOM tree. ` +
                ` > | Selector('#not-exists') ` +
                ` [[user-agent]] ` +
                ` 1 |fixture \`Compiler service\`;` +
                ` 2 |` +
                ` 3 |test(\`Throw an error\`, async t => {` +
                ` > 4 |    await t.click('#not-exists');` +
                ` 5 |});` +
                ` 6 |  at <anonymous> (${path.join(__dirname, 'testcafe-fixtures/error-test.js')}:4:13)`
            ])).to.be.true;
        }
    });

    it('Should allow using ClientFunction in assertions', async () => {
        await runTests('testcafe-fixtures/client-function-in-assertions.js', 'ClientFunction in assertions');
    });

    it('Should execute Selectors in sync mode', async () => {
        await runTests('testcafe-fixtures/synchronous-selectors.js');
    });

    describe('Request Hooks', () => {
        describe('Request Logger', () => {
            it('Basic', async () => {
                await runTests('../api/es-next/request-hooks/testcafe-fixtures/request-logger/api.js', 'API');
            });

            it('Log options', async () => {
                await runTests('../api/es-next/request-hooks/testcafe-fixtures/request-logger/log-options.js', 'Log options');
            });

            it('Request filter rule predicate', async () => {
                await runTests('../api/es-next/request-hooks/testcafe-fixtures/request-logger/request-filter-rule-predicate.js');
            });
        });

        describe('Request Mock', function () {
            it('Basic', async () => {
                await runTests('../api/es-next/request-hooks/testcafe-fixtures/request-mock/basic.js');
            });

            it('Asynchronous response function (GH-4467)', () => {
                return runTests('../api/es-next/request-hooks/testcafe-fixtures/request-mock/async-response-function.js');
            });

            it('Request failed the CORS validation', async () => {
                await runTests('../api/es-next/request-hooks/testcafe-fixtures/request-mock/failed-cors-validation.js', 'Failed CORS validation', { only: 'chrome' })
                    .then(() => {
                        expect(testReport.warnings).eql([
                            'RequestMock: CORS validation failed for a request specified as { url: "http://dummy-url.com/get" }'
                        ]);
                    });
            });
        });

        describe('Request Hook', () => {
            it('Change and remove response headers', async () => {
                await runTests('../api/es-next/request-hooks/testcafe-fixtures/api/change-remove-response-headers.js');
            });
        });
    });
});
