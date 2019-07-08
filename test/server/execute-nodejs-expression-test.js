const { noop } = require('lodash');
const expect   = require('chai').expect;

const TestRun        = require('../../lib/test-run/index');
const TestController = require('../../lib/api/test-controller');
const COMMAND_TYPE   = require('../../lib/test-run/commands/type');

const ERROR_LINE_COLUMN_REGEXP = /:(\d):(\d)/;

function createTestRunMock () {
    function TestRunMock () {
        this.test       = { name: 'Test', testFile: { filename: __filename } };
        this.debugLog   = { command: noop };
        this.controller = new TestController(this);
    }

    TestRunMock.prototype = TestRun.prototype;

    return new TestRunMock();
}

async function executeExpression (expression, testRun = createTestRunMock()) {
    expression = `(async function () {
${expression}
})`;

    return await testRun.executeCommand({
        type: COMMAND_TYPE.executeNodeExpression,
        expression
    });
}

async function assertError (expression, expectedMessage, expectedLine, expectedColumn) {

        await executeExpression(expression);

        expect(err.message).eql(expectedMessage);

        const result = err.stack.match(ERROR_LINE_COLUMN_REGEXP);

        expect(result).is.not.null;

        const line   = parseInt(result[1], 10);
        const column = parseInt(result[2], 10);

        expect(line).eql(expectedLine);
        expect(column).eql(expectedColumn);
}

describe.only('Code steps', () => {
    it('basic', async () => {
        const res = await executeExpression('return 1+1;');

        expect(res).eql(2);
    });

    it('error', async () => {

        debugger;

        await assertError('u;', 'u is not defined', 1, 1);

        await assertError(
            'let q = 3;\n' +
            '        u;'
            , 'u is not defined', 2, 9);

        await assertError(
            'let q = 3;\n' +
            'q = 4;\n' +
            'throw new Error(\'custom error\')'
            , 'custom error', 3, 7);
    });

    it('shared context with global variables', async () => {
        const testRun = createTestRunMock();

        await executeExpression('result = 10;', testRun);

        const res = await executeExpression('return result + 3', testRun);

        /* eslint-disable no-undef */
        expect(result).eql(10);
        /* eslint-enable no-undef */
        expect(res).eql(13);
    });

    it('shared context with local variables', async () => {
        const testRun = createTestRunMock();

        await executeExpression('const result = 10;', testRun);

        try {
            await executeExpression('return result + 3', testRun);
        }
        catch (err) {
            expect(err.message).eql('result is not defined');
        }
    });

    it('different context', async () => {
        await executeExpression('result = 10;');

        try {
            await executeExpression('result + 3');
        }
        catch (err) {
            expect(err.message).eql('result is not defined');
        }
    });

    it('promises', () => {
        return executeExpression(`
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve('hooray!');
                }, 20);
            });
        `)
            .then(result => {
                expect(result).eql('hooray!');
            });
    });

    it('async/await', () => {
        return executeExpression(`
            const promise = new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve('hooray!');
                }, 20);
            });
            
            const result = await promise;
            
            return result;
        `)
            .then(result => {
                expect(result).eql('hooray!');
            });
    });

    it('require - absolute', async () => {
        await executeExpression(`
            return require('testcafe-hammerhead');
        `)
            .then(result => {
                expect(result).eql(require('testcafe-hammerhead'));
            });
    });

    it('require - relative', async () => {
        await executeExpression(`
            return require('./helpers/console-wrapper');
        `)
            .then(result => {
                expect(result).eql(require('./helpers/console-wrapper'));
            });
    });

    it('globals', async () => {
        const result = await executeExpression(`
            Buffer.from('test');
            
            const timeout    = setTimeout(function () {});
            const immediate  = setImmediate(function () {});
            const interval   = setInterval(function () {});
            
            clearTimeout(timeout);
            clearImmediate(immediate);
            clearInterval(interval);
            
            return { __dirname, __filename };
        `);

        expect(result.__dirname).eql(__dirname);
        expect(result.__filename).eql(__filename);
    });

    describe('test controller', () => {
        it('basic', async () => {
            await executeExpression(`
                await t.wait(1);
            `);
        });

        it('shared context', async () => {
            const testRun = createTestRunMock();

            await executeExpression(`
                t.testRun.sharedVar = 1;
            `, testRun);

            await executeExpression(`
                if (!t.testRun.sharedVar)
                    t.testRun.sharedVar = 2;
            `, testRun);

            expect(testRun.sharedVar).eql(1);
        });

        it('different context', async () => {
            const testRun1 = createTestRunMock();
            const testRun2 = createTestRunMock();

            await executeExpression(`
                t.testRun.sharedVar = 1;
            `, testRun1);

            await executeExpression(`
                if (!t.testRun.sharedVar)
                    t.testRun.sharedVar = 2;
            `, testRun2);

            expect(testRun1.sharedVar).eql(1);
            expect(testRun2.sharedVar).eql(2);
        });
    });
});
