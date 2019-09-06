const createTestCafe = require('D:\\Projects\\testcafe\\lib');
let testcafe         = null;
let liveRunner       = null;

function start () {
    return createTestCafe('localhost', 1337, 1338)
        .then(tc => {
            testcafe   = tc;
            liveRunner = testcafe.createLiveModeRunner();

            setTimeout(() => {
                // console.log('stop runner');

                return liveRunner.stop()
                    .then(() => {
                        return liveRunner
                            .browsers(['firefox'])
                            .src('D:\\Projects\\testcafe\\test\\functional\\fixtures\\regression\\gh-1994\\testcafe-fixtures\\index2.js')
                            .run().then(() => {
                                // console.log('hooray!!!');
                            })
                            .then(() => {
                                return testcafe.close();
                            });
                    });
            }, 10000);

            return liveRunner
                .src('D:\\Projects\\testcafe\\test\\functional\\fixtures\\regression\\gh-1994\\testcafe-fixtures\\index.js')
                .browsers(['chrome'])
                .run()
                .then(() => {
                    // console.log('run run');
                });
        });
}

start();

