import https from 'https';

const executeRequest = () => {
    return new Promise(resolve => {
        const options = {
            hostname: ' https://api.com/move/sample',
            port:     443,
            path:     '/',
            method:   'POST'
        };

        const req = https.request(options, res => {
            console.log('statusCode:', res.statusCode);
            console.log('headers:', res.headers);
            resolve();
        });

        req.on('error', e => {
            console.error(e);
        });

        req.end();
    });
};

fixture `fixture`
    .page `http://google.com`
    .beforeEach(async t => {
        await executeRequest();
    });

test('test', async t => {
    // test code
});
