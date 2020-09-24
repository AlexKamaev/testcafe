fixture `Screenshots`
    .page('http://localhost:3000/fixtures/multiple-windows/pages/features/screenshots/parent.html');

test('should make screenshots of multiple windows', async t => {
    await t.takeScreenshot('custom/' + Date.now() + '.png');

    const child = await t.openWindow('http://localhost:3000/fixtures/multiple-windows/pages/features/screenshots/child.html');

    await t.takeScreenshot('custom/' + Date.now() + '.png');
    await t.openWindow('http://localhost:3000/fixtures/multiple-windows/pages/features/screenshots/parent.html');
    await t.takeScreenshot('custom/' + Date.now() + '.png');
    await t.switchToWindow(child);
    await t.takeScreenshot('custom/' + Date.now() + '.png');


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
