import { Selector } from 'testcafe';

const parentUrl = 'http://localhost:3000/fixtures/run-options/allow-multiple-windows/pages/api/parent.html';
const child1Url = 'http://localhost:3000/fixtures/run-options/allow-multiple-windows/pages/api/child-1.html';
const child2Url = 'http://localhost:3000/fixtures/run-options/allow-multiple-windows/pages/api/child-2.html';

fixture `API`
    .page(parentUrl);

test('Open child window', async t => {
    await t
        .expect(Selector('h1').innerText).eql('parent')
        .openWindow(child1Url)
        .expect(Selector('h1').innerText).eql('child-1');
});

test('Close current window', async t => {
    await t
        .openWindow(child1Url)
        .expect(Selector('h1').innerText).eql('child-1')
        .closeWindow()
        .expect(Selector('h1').innerText).eql('parent');
});

test('Get current window', async t => {
    const parentWindow  = await t.getCurrentWindow();
    const childWindow   = await t.openWindow(child1Url);
    const currentWindow = await t.getCurrentWindow();

    await t.expect(parentWindow.id).ok();
    await t.expect(childWindow.id).ok();
    await t.expect(parentWindow.id).notEql(childWindow.id);
    await t.expect(currentWindow.id).eql(childWindow.id);
});

test('Switch to parent window', async t => {
    const parentWindow = await t.getCurrentWindow();

    await t
        .openWindow(child1Url)
        .expect(Selector('h1').innerText).eql('child-1');

    let currentWindow = await t.getCurrentWindow();

    await t.expect(currentWindow.id).notEql(parentWindow.id);

    currentWindow = await t
        .switchToWindow(parentWindow)
        .getCurrentWindow();

    await t
        .expect(currentWindow.id).eql(parentWindow.id)
        .expect(Selector('h1').innerText).eql('parent');
});

test('Switch to child window', async t => {
    let currentWindow = null;

    const parentWindow = await t.getCurrentWindow();
    const childWindow  = await t.openWindow(child1Url);

    await t.expect(Selector('h1').innerText).eql('child-1');

    await t.switchToWindow(parentWindow);

    currentWindow = await t.getCurrentWindow();

    await t
        .expect(currentWindow.id).eql(parentWindow.id)
        .expect(Selector('h1').innerText).eql('parent')
        .switchToWindow(childWindow);

    currentWindow = await t.getCurrentWindow();

    await t.expect(currentWindow.id).eql(childWindow.id)
        .expect(Selector('h1').innerText).eql('child-1');
});

test('Switch to other child', async t => {
    const parentWindow = await t.getCurrentWindow();
    const child1Window = await t.openWindow(child1Url);

    await t
        .switchToWindow(parentWindow)
        .openWindow(child2Url)
        .expect(Selector('h1').innerText).eql('child-2')
        .switchToWindow(child1Window);

    const currentWindow = await t.getCurrentWindow();

    await t
        .expect(currentWindow.id).eql(child1Window.id)
        .expect(Selector('h1').innerText).eql('child-1');
});

test('Switch to deep child', async t => {
    const parentWindow = await t.getCurrentWindow();

    const child2Window = await t
        .openWindow(child1Url)
        .openWindow(child1Url)
        .openWindow(child2Url);

    await t
        .switchToWindow(parentWindow)
        .openWindow(child1Url)
        .openWindow(child1Url)
        .openWindow(child1Url)
        .switchToWindow(child2Window);

    const currentWindow = await t.getCurrentWindow();

    await t
        .expect(currentWindow.id).eql(child2Window.id)
        .expect(Selector('h1').innerText).eql('child-2');
});


test('Close specific window from parent', async t => {
    const parentWindow = await t.getCurrentWindow();
    const childWindow  = await t.openWindow(child1Url);

    await t.switchToWindow(parentWindow);

    await t.closeWindow(childWindow);

    // await t.debug();
    //
    // await t.switchToWindow(childWindow);
});

test('Close parent window and catch error', async t => {
    // throw new Error('Not implemented');
});
