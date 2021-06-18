import { Selector } from 'testcafe';

const btnPrev = Selector('#btnPrev_c1');
const btnShadow = Selector('div').shadowRoot().find('#btnShadow2_c1')
const btnNext = Selector('#btnNext');

fixture `f`
    .page `../pages/case2.html`;

test(`tab`, async t => {
    // await t.click(btnPrev);

    await t.pressKey('tab');
    //
    // await t.expect(btnShadow.focused).eql(true);
});

// test(`shift+tab`, async t => {
//     await t.click(btnNext);
//
//     await t.pressKey('shift+tab');
//
//     await t.expect(btnShadow.focused).eql(true);
// });
