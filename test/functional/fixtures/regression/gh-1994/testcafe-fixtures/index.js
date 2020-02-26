import { Selector } from 'testcafe';

fixture`Fixture 1`
    .page`https://devexpress.github.io/testcafe/example`;
//
// test('Test 1.1', async t => {
//     await t
//         .click(Selector('#developer-name'), { speed: 0.5, modifiers: { ctrl: true } })
//         .typeText(Selector('#developer-name'), 'Peter')
//         .click(Selector('#tried-test-cafe'))
//         .drag(Selector('.ui-slider-handle.ui-corner-all.ui-state-default'), 94, -2, {
//             offsetX: 8,
//             offsetY: 12
//         })
//         // .expect(Selector('#developer-name').value).eql('Peter1');
// });
//
// test('Test 1.2', async t => {
//     await t
//         .click(Selector('#developer-name'), { speed: 0.5, modifiers: { ctrl: true } })
//         .typeText(Selector('#developer-name'), 'Peter')
//         .click(Selector('#tried-test-cafe'))
//         .drag(Selector('.ui-slider-handle.ui-corner-all.ui-state-default'), 94, -2, {
//             offsetX: 8,
//             offsetY: 12
//         })
//     // .expect(Selector('#developer-name').value).eql('Peter1');
// });
//
// test('Test 1.3', async t => {
//     await t
//         .click(Selector('#developer-name'), { speed: 0.5, modifiers: { ctrl: true } })
//         .typeText(Selector('#developer-name'), 'Peter')
//         .click(Selector('#tried-test-cafe'))
//         .drag(Selector('.ui-slider-handle.ui-corner-all.ui-state-default'), 94, -2, {
//             offsetX: 8,
//             offsetY: 12
//         })
//     // .expect(Selector('#developer-name').value).eql('Peter1');
// });
//
// test('Test 1', async t => {
//     await t
//         .click(Selector('#developer-name'), { speed: 0.5, modifiers: { ctrl: true } })
//         .typeText(Selector('#developer-name'), 'Peter')
//         .click(Selector('#tried-test-cafe'))
//         .drag(Selector('.ui-slider-handle.ui-corner-all.ui-state-default'), 94, -2, {
//             offsetX: 8,
//             offsetY: 12
//         })
//     // .expect(Selector('#developer-name').value).eql('Peter1');
// });
//
// test('Test 1', async t => {
//     await t
//         .click(Selector('#developer-name'), { speed: 0.5, modifiers: { ctrl: true } })
//         .typeText(Selector('#developer-name'), 'Peter')
//         .click(Selector('#tried-test-cafe'))
//         .drag(Selector('.ui-slider-handle.ui-corner-all.ui-state-default'), 94, -2, {
//             offsetX: 8,
//             offsetY: 12
//         })
//     // .expect(Selector('#developer-name').value).eql('Peter1');
// });
//
// test('Test 1', async t => {
//     await t
//         .click(Selector('#developer-name'), { speed: 0.5, modifiers: { ctrl: true } })
//         .typeText(Selector('#developer-name'), 'Peter')
//         .click(Selector('#tried-test-cafe'))
//         .drag(Selector('.ui-slider-handle.ui-corner-all.ui-state-default'), 94, -2, {
//             offsetX: 8,
//             offsetY: 12
//         })
//     // .expect(Selector('#developer-name').value).eql('Peter1');
// });

fixture`Fixture 1`
    .page`https://devexpress.github.io/testcafe/example`;

test('Test 1.1', async t => {
    await t.wait(2000);
});

test('Test 1.2', async t => {
    await t.wait(2000);
});

test('Test 1.3', async t => {
    await t.wait(2000);
});

test('Test 1.4', async t => {
    await t.wait(2000);
});

test('Test 1.5', async t => {
    await t.wait(2000);
});


fixture`Fixture 2`
    .page`https://devexpress.github.io/testcafe/example`;

test('Test 2.1', async t => {
    await t.wait(2000);
});

test('Test 2.2', async t => {
    await t.wait(2000);
});

test('Test 2.3', async t => {
    await t.wait(2000);
});

test('Test 2.4', async t => {
    await t.wait(2000);
});

test('Test 2.5', async t => {
    await t.wait(2000);
});

fixture`Fixture 3`
    .page`https://devexpress.github.io/testcafe/example`;

test('Test 3.1', async t => {
    await t.wait(2000);
});

test('Test 3.2', async t => {
    await t.wait(2000);
});

test('Test 3.3', async t => {
    await t.wait(2000);
});

test('Test 3.4', async t => {
    await t.wait(2000);
});

test('Test 3.5', async t => {
    await t.wait(2000);
});
