import { Selector } from 'testcafe';

fixture `GH-2205 - Should type in div if it has an invisible child with contententeditable=false`
    .page `../pages/index.html`;

async function typeAndCheck (t, editorId) {
    const editor = Selector(editorId);

    await t
        .click(editor)
        .typeText(editor, 'H')
        .wait(1000)
        .expect(editor.innerText).contains('H');
}

test(`Click on div with display:none placeholder`, async t => {
    await typeAndCheck(t, '#editor1');
});

// test(`Click on div with visibility:hidden placeholder`, async t => {
//     await typeAndCheck(t, '#editor2');
// });


