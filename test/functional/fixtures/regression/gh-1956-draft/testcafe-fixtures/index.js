import { Selector, ClientFunction } from 'testcafe';

 fixture("Draft.js").page("http://kamaev-w8:3000");
// fixture("Draft.js").page("https://draftjs.org/");


const editor = Selector('.public-DraftStyleDefault-block');

const setFocus = ClientFunction(() => document.querySelector('.public-DraftEditor-content').focus());

test("Can type into the draftjs editor", async t => {
    await t.click(editor);
    // await setFocus();
    await t.typeText(editor, 'H');
       // await t.wait(1000000);
    // await t.expect(editor.textContent).eql('H');

    // await t.debug();

});


// import { Selector, ClientFunction } from 'testcafe';
//
// fixture("Draft.js").page("http://127.0.0.1:8080/test.html");
//
// // const editor = Selector('#CONTENT_EDITOR');
// const editor = Selector('.public-DraftEditor-content');
//
//
//
// test("Can type into the draftjs editor", async t => {
//     await t.click(editor);
//     // await setFocus();
//      await t.typeText(editor, 'H');
//      // await t.wait(1000000);
//     await t.expect(editor.textContent).eql('H\n');
//
// });