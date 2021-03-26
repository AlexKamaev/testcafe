fixture `GH-1994 - The element that matches the specified selector is not visible`
    .page `../pages/index.html`;

test(`mousedown`, async t => {
    // await t.mouseDown('div');
    //
    // await t.wait(300);
    //
    // await t.mouseUp('input');
    //
    // await t.debug();

    // await t.click('div');

    await t.mouseDown('div');
    //
    // await t.wait(300);
    //
    await t.mouseUp('div');
    //
    // await t.debug();
});
