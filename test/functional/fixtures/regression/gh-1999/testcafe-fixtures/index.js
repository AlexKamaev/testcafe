fixture `GH-1999 - Shouldn't raise an error if an iframe has html in src`
    .page `http://localhost:8080/parent.html`;

test('iframe', async t => {
    await t.debug();

    await t.switchToIframe('iframe');

    await t.click('a');

    await t.hover('button');

    await t.wait(4000);

    await t.click('button');


    // await t.switchToPreviousWindow();
    //
    // await t.hover('a');
});

// test('2', async t => {
//     await t.click('a');
//
//     await t.click('button');
// });
