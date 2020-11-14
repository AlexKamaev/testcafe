import { Selector } from 'testcafe';

fixture `GH-1999 - Shouldn't raise an error if an iframe has html in src`
    .page `http://localhost:8080/parent.html`;

test('iframe', async t => {
    await t.switchToIframe('iframe');

    await t.click(Selector('button').withText('frame'));

    await t.click('a');

    await t.click(Selector('button').withText('child'));

    await t.switchToPreviousWindow();

    await t.click(Selector('button').withText('parent'));

    await t.switchToPreviousWindow();

    await t.click(Selector('button').withText('child'));
});
