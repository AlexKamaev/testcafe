import { Selector, ClientFunction } from 'testcafe';

const blue = ClientFunction(() => {
    window.document.body.style.backgroundColor = 'blue';
})

fixture `GH-1999 - Shouldn't raise an error if an iframe has html in src`
    .page `http://localhost:8080/parent.html`;

test('iframe', async t => {
    const parent = await t.getCurrentWindow();

    console.log(parent);

    await t.switchToIframe('iframe');



    await t.click(Selector('button').withText('frame'));

    await t.click('a');

    // await t.wait(5000);

    await t.click(Selector('button').withText('child'));

    await t.switchToPreviousWindow();

    console.log(await t.getCurrentWindow());

    // await t.debug();

    // await t.switchToWindow(parent);
    //
    // console.log(await t.getCurrentWindow());
    //
    await blue();

    await t.debug();


    // console.log(await t.getCurrentWindow());

    // await t.click(Selector('button').withText('parent'));
});

// test('2', async t => {
//     await t.click('a');
//
//     await t.click('button');
// });
