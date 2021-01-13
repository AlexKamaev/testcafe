import { Selector, ClientFunction, RequestMock } from 'testcafe';

fixture `test`
    .page `http://localhost:8080/parent.html`;

const now = Date.now();

const reg = new RegExp('yandex|google');

const mock = RequestMock().onRequestTo(reg)
    .respond('', 200);

const foo = ClientFunction(() => {
    debugger;

   console.log = function (text) {
       var div = document.getElementById('kekeke');

       if (!div) {
           div = document.createElement('div');

           div.id = 'kekeke';

           div.style.position = 'fixed';
           div.style.top = 0;
           div.style.left = 0;
           div.style.right = 0;

           div.style.backgroundColor = 'black';
           div.style.color = 'white';
           div.style.height = '900px';
           div.style.zIndex = 99999;

           document.body.appendChild(div);
       }

       div.innerHTML += text + '<br/>';
   };
});

for (let i = 0; i < 1; i++) {
    // test.requestHooks(mock)(`${now}`, async t => {
    test(`${now}`, async t => {
        // await foo();
        console.log('+');
        // await t.openWindow('http://localhost:1340');

        await t.openWindow('http://mail.ru');


        // await foo();

        // await t.wait(5000);

        // await t.openWindow('http://example.com');

        // await t.openWindow('http://localhost:8080/child.html');

        await t.maximizeWindow();

        // await t.wait(5000);

        await t.takeScreenshot(`_${now}_child.png`);

        // console.log('++');


        // await t.wait(2000);

        let { log } = await t.getBrowserConsoleMessages();

        console.log(log);
        //
        await t.switchToPreviousWindow();
        // //

        await t.takeScreenshot(`_${now}-parent.png`);

        // await t.switchToPreviousWindow();
        //
        // await t.takeScreenshot(`_${now}-child-log.png`);

        log = await t.getBrowserConsoleMessages();

        console.log(log);
        //
        // console.log('+++');
        //
        // await t.openWindow('http://google.com');
        //
        // await t.takeScreenshot('child2.png');

        // await t.wait(5000);


    });


}
