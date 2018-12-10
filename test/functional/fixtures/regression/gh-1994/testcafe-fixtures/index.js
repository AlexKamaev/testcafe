fixture `GH-1994 - The element that matches the specified selector is not visible`
    .page `../pages/index.html`;

test(`Recreate invisible element and click`, async t => {
    await t
        .click('#targetRecreate');
});

test(`Remove invisible element and click`, async t => {
    await t
        .click('#targetRemove');
});






