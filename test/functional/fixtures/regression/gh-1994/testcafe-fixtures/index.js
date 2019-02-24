fixture `GH-1994 - The element that matches the specified selector is not visible`
    .page `D:/Projects/testcafe/test/functional/fixtures/api/es-next/take-screenshot/pages/crop-scrollbars.html`;

test(`Recreate invisible element and click`, async t => {
    await t
        .click('#target');
});
