fixture `Should restore local storage correctly on UseRole with PreserveUrl`
    .page `http://localhost:3000/fixtures/regression/gh-9999/pages/index.html`;

test('123', async t => {
    await t.wait(0);

    /* eslint-disable no-new */
    new Promise((resolve, reject) => {
        reject(new Error('reject'));
    });
    /* eslint-enable no-new */
});
