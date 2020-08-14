fixture `Test page`
    .page('http://localhost:8080');

test('Open and close', async t => {
    await t.click('#btn1');
    await t.wait(10000);
    await t.click('div');
});
