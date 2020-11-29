const http                  = require('https');
const createTestCafe        = require('../../../../../../lib');
const selfSignedSertificate = require('openssl-self-signed-certificate');


const sslOptions = {
    key:  selfSignedSertificate.key,
    cert: selfSignedSertificate.cert
};

const SIGNIFICANT_REQUEST_TIMEOUT = 100;

let previousRequestTime = null;

function createServer () {
    const ERROR_RESPONSE_COUNT = 10;

    let requestCounter = 0;

    const requestListener = function (req, res) {
        debugger;

        // if (req.headers['sec-fetch-mode'] === 'navigate')

        const now = Date.now();

        if (previousRequestTime && now - previousRequestTime > SIGNIFICANT_REQUEST_TIMEOUT)
            requestCounter++;

        previousRequestTime = now;

        console.log(req.url + ': ' + Date.now());
        console.log(req.headers['sec-fetch-mode']);

        if (requestCounter < ERROR_RESPONSE_COUNT) {
            console.log('+');
            // console.log(req.url);
            // res.writeHead(503);
            // res.end();
            req.destroy();
            // res.writeHead(503);
            // res.end();
        }
        else {
            res.writeHead(200);
            res.end('<h1>example</h1>');
        }
    };

    const server = http.createServer(sslOptions, requestListener);

    server.listen(8083);
}

async function foo () {
    // const testcafe = await createTestCafe('localhost', 1337, 1338, sslOptions, true, true);
    const testcafe = await createTestCafe('localhost', 1337, 1338);
    const runner   = testcafe.createRunner();

    await runner
        .src('D:\\projects\\testcafe\\test\\functional\\fixtures\\regression\\gh-1994\\testcafe-fixtures\\index.js')

        // Browsers restrict self-signed certificate usage unless you
        // explicitly set a flag specific to each browser.
        // For Chrome, this is '--allow-insecure-localhost'.
        .browsers('chrome --allow-insecure-localhost --auto-open-devtools-for-tabs')
        .run();

    await testcafe.close();
}
createServer();
foo();


