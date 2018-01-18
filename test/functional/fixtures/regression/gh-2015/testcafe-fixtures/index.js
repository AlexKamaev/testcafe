import { Selector } from 'testcafe';

fixture `local-storage`;

import userRole from './role';

test('test 1', async t => {
     console.log('start');
    // await t.wait(2000);
    await t.useRole(userRole);
    // await t.wait(2000);
     console.log('assert')
    await t.expect(Selector('#result').textContent).eql('logged');
    // await t.wait(2000);
    console.log('finish');
});
//

test('test 2', async t => {
    console.log('start2');
    await t.useRole(userRole);
    await t.expect(Selector('#result').textContent).eql('logged');
    console.log('finish2');
});
