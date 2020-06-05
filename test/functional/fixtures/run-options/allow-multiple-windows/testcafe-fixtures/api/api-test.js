import { Selector } from 'testcafe';

fixture `API`
    .page('http://localhost:3000/fixtures/run-options/allow-multiple-windows/pages/api/parent.html');

test('Open child window', async t => {
    await t.expect(Selector('h1').innerText).eql('parent');

    await t.openWindow('http://localhost:3000/fixtures/run-options/allow-multiple-windows/pages/api/child-1.html');

    await t.expect(Selector('h1').innerText).eql('child-1');
});

test('Close current window', async t => {
    await t.openWindow('http://localhost:3000/fixtures/run-options/allow-multiple-windows/pages/api/child-1.html');

    await t.expect(Selector('h1').innerText).eql('child-1');

    await t.closeWindow();

    await t.expect(Selector('h1').innerText).eql('parent');
});
