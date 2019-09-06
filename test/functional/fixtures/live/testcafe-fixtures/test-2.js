import helper from '../test-helper';

fixture `Stops and starts 2`
    .page `../pages/index.html`
    .after(() => {
        helper.watcher.emit('test-complete');
    });

test('Stops and starts 1', async t => {
    for (let i = 0; i < 10; i++) {
        await t.click('h1');
    }
})
