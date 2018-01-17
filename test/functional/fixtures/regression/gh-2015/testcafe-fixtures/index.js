import { Selector } from 'testcafe';

fixture `local-storage`;

import userRole from './role';

test('test 1', async t => {
    await t.useRole(userRole);
    await t.expect(Selector('#result').textContent).eql('logged');
    console.log('finish1');
});

test('test 2', async t => {
    console.log('start2');
    await t.useRole(userRole);
    await t.expect(Selector('#result').textContent).eql('logged');
    console.log('finish2');
});
