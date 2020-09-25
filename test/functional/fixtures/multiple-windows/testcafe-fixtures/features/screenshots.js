const RED_PAGE   = 'http://localhost:3000/fixtures/multiple-windows/pages/features/screenshots/red.html';
const GREEN_PAGE = 'http://localhost:3000/fixtures/multiple-windows/pages/features/screenshots/green.html';

fixture `Screenshots`
    .page(RED_PAGE);

test('should make screenshots of multiple windows', async t => {
    await t.takeScreenshot('custom/0.png');

    const child = await t.openWindow(GREEN_PAGE);

    await t.takeScreenshot('custom/1.png');
    await t.openWindow(RED_PAGE);
    await t.takeScreenshot('custom/2.png');
    await t.switchToWindow(child);
    await t.takeScreenshot('custom/3.png');


    // await t.resizeWindow(400, 300);
    //
    // await t.takeScreenshot('kekeke1.png');
    //
    // const wnd = await t.openWindow('http://github.com');
    //
    // await t.takeScreenshot('kekeke2.png');
    //
    // await t.openWindow('http://mail.ru');
    //
    // await t.takeScreenshot('kekeke3.png');
    //
    // await t.switchToWindow(wnd);
    //
    // await t.takeScreenshot('kekeke4.png');
});
