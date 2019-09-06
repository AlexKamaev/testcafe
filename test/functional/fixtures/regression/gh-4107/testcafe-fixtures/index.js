fixture `Getting Started`
    .page `http://devexpress.github.io/testcafe/example`;

test('My first test', async t => {
    // Test code
    for (let i = 0; i < 10; i++)
        await t.click('h1');
});
