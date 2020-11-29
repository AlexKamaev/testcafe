import { Selector } from 'testcafe';

fixture `GH-1994 - The element that matches the specified selector is not visible`
    .page `https://localhost:8083/test`;

test(`Recreate invisible element and click`, async t => {
    await t.click(Selector('h1').withText('example'));

    // await t.navigateTo('https://localhost:8083/test');
});
