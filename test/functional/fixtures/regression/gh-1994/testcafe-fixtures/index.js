import { Selector, ClientFunction, RequestMock } from 'testcafe';

fixture `test`
    .page `http://localhost:8080/parent.html`;

const now = Date.now();

const reg = new RegExp('yandex|google');

const mock = RequestMock().onRequestTo(reg)
    .respond('', 200);



for (let i = 0; i < 1; i++) {
    // test.requestHooks(mock)(`${now}`, async t => {
    test(`${now}`, async t => {
        console.log('+');
        // await t.openWindow('http://localhost:1340');

        await t.openWindow('http://mail.ru');

        // await t.wait(5000);

        // await t.openWindow('http://example.com');

        // await t.openWindow('http://localhost:8080/child.html');

        await t.maximizeWindow();

        // await t.wait(5000);

        await t.takeScreenshot(`_${now}_child.png`);

        // console.log('++');


        let { log } = await t.getBrowserConsoleMessages();

        console.log(log);
        //
        await t.switchToPreviousWindow();
        // //
        await t.takeScreenshot(`_${now}-parent.png`);

        log = await t.getBrowserConsoleMessages();

        console.log(log);
        //
        // console.log('+++');
        //
        // await t.openWindow('http://google.com');
        //
        // await t.takeScreenshot('child2.png');


    });


}
