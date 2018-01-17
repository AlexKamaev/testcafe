import { Selector } from 'testcafe';


fixture `local-storage`;

import UserRole from './role';

test('test 1', async t => {
    await t.useRole(UserRole);
    await t.expect(Selector('#result').textContent).eql('logged');
});

test('test 2', async t => {
    await t.useRole(UserRole);
    await t.expect(Selector('#result').textContent).eql('logged');
});
