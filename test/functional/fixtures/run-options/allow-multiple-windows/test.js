const { expect }     = require('chai');
const createTestCafe = require('../../../../../lib');
const path           = require('path');

.browsers(['chrome:userProfile:emulation:iphone X'])

const testcafe = await createTestCafe('localhost', 1337, 1338);
const runner   = testcafe.createRunner();

await runner
    .src('test.js')

    // Browsers restrict self-signed certificate usage unless you
    // explicitly set a flag specific to each browser.
    // For Chrome, this is '--allow-insecure-localhost'.
    .browsers('chrome --allow-insecure-localhost')
    .run();
