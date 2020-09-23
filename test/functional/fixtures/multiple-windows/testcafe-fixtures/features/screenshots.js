fixture `Screenshots`
    .page('http://example.com');

test('should make screenshots of multiple windows', async t => {

    await t.resizeWindow(400, 300);

    await t.takeScreenshot('kekeke1.png');

    const wnd = await t.openWindow('http://github.com');

    await t.takeScreenshot('kekeke2.png');

    await t.openWindow('http://mail.ru');

    await t.takeScreenshot('kekeke3.png');

    await t.switchToWindow(wnd);

    await t.takeScreenshot('kekeke4.png');
});
