import { Selector } from 'testcafe';

const parentUrl = 'http://localhost:3000/fixtures/run-options/allow-multiple-windows/pages/api/parent.html';
const child1Url = 'http://localhost:3000/fixtures/run-options/allow-multiple-windows/pages/api/child-1.html';

fixture `API`
    .page(parentUrl);

test('Open child window', async t => {
    await t.expect(Selector('h1').innerText).eql('parent');

    await t.openWindow(child1Url);

    await t.expect(Selector('h1').innerText).eql('child-1');
});

test('Close current window', async t => {
    await t.openWindow(child1Url);

    await t.expect(Selector('h1').innerText).eql('child-1');

    await t.closeWindow();

    await t.expect(Selector('h1').innerText).eql('parent');
});

test('Get current window', async t => {
    const parentWindow = await t.getCurrentWindow();

    await t.openWindow(child1Url);

    const childWindow = await t.getCurrentWindow();

    await t.expect(parentWindow.id).ok();
    await t.expect(childWindow.id).ok();
    await t.expect(parentWindow.id).notEql(childWindow.id);
});

test.only('Switch to parent window', async t => {
    const parentWindow = await t.getCurrentWindow();

    await t.openWindow(child1Url);

    await t.expect(Selector('h1').innerText).eql('child-1');

    await t.switchToWindow(parentWindow);

    await t.expect(Selector('h1').innerText).eql('parent');
});

test('Switch to child window', async t => {
    let currentWindow = null;

    const parentWindow = await t.getCurrentWindow();

    await t.openWindow(child1Url);

    const childWindow = await t.getCurrentWindow();

    await t.switchToWindow(parentWindow);

    currentWindow = await t.getCurrentWindow();

    await t.expect(currentWindow.id).eql(parentWindow.id);

    await t.switchToWindow(childWindow);

    currentWindow = await t.getCurrentWindow();

    await t.expect(currentWindow.id).eql(childWindow.id);
});

test.skip('Close specific window', async t => {
   throw new Error('Not implemented');
});

test.skip('Close parent window and catch error', async t => {
    throw new Error('Not implemented');
});
