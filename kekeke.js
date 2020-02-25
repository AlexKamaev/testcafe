const createTestCafe = require('./lib');

async function sleep () {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, 5000);
    });
}

function customReporter () {
    return {
        async reportTaskStart (startTime, userAgents, testCount) {

        },
        async reportFixtureStart (name, path, meta) {
            // debugger;
            console.log(`---------------reportFixtureStart: ${name}`);
            await sleep();
            console.log(`+++++++++++++++reportFixtureStart: ${name}`);
        },
        async reportTestStart (name, meta) {
            console.log(`---------------reportTestStart: ${name}`);
            await sleep();
            console.log(`+++++++++++++++reportTestStart: ${name}`);
        },
        async reportTestActionDone (apiActionName, actionInfo) {

        },
        async reportTestDone (name, testRunInfo, meta) {
            console.log(`----------------reportTestDone: ${name}`);

            await sleep();

            console.log(`++++++++++++++++reportTestDone: ${name}`);
        },
        async reportTaskDone (endTime, passed, warnings, result) {
        }
    };
}

let runner = null;
let cafe   = null;

createTestCafe('localhost', 1337, 1338)
    .then(testcafe => {
        runner = testcafe.createRunner();

        cafe = testcafe;
    })
    .then(() => {
        return runner
            .src('D:\\Projects\\testcafe\\test\\functional\\fixtures\\regression\\gh-1994\\testcafe-fixtures\\index.js')
            .browsers('chrome')
            .reporter(customReporter)
            .concurrency(4)
            .run();
    })
    .then(() => {
        return cafe.close();
    });
