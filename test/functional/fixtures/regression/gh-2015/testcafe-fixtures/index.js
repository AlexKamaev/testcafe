import { ClientFunction, Selector } from 'testcafe';

fixture `Should restore local storage correctly on UseRole with PreserveUrl`;

import userRole from './role';
import { parse } from "useragent";




const getUserAgent = ClientFunction(() => navigator.userAgent.toString());

test('Should log in with role navigation', async t => {
        // throw new Error('kekeke');

    await t.useRole(userRole);
    await t.expect(Selector('#result').textContent).eql('logged');
});

test('Should restore logged state without page navigation', async t => {
    await t.useRole(userRole);

    const ua = await getUserAgent();

    console.log('parse(ua).family: ' + parse(ua).family);

    if (parse(ua).family === 'Chrome') {
        new Promise((resolve, reject) => {
            console.log('rejection');
            reject(new Error('unhandled promise rejection'));
        });
    }

    await t.expect(Selector('#result').textContent).eql('logged');
});
