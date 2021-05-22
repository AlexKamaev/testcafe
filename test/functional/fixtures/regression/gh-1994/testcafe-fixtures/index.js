import { Selector } from 'testcafe';

fixture `GH-1994 - The element that matches the specified selector is not visible`
    .page `http://example.com`;

test(`Recreate invisible element and click`, async t => {
    await t.debug();
    //

    // await t.click('body');

    //
    //  debugger;

    // await t.click('body');


    // debugger;
    //
    //
    //
    // const q = Selector;
    // //
    // const el = q('h1');
    // // debugger;
    // //
    // const wwe = el();
    // //
    // //
    // // await t.debug();
    //
    // await t.click('body');
});
