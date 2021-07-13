import { Selector } from 'testcafe';

fixture `test`
    .page `D:\\projects\\testcafe\\test\\functional\\fixtures\\regression\\gh-1999\\pages\\index.html`;

test('filterVisible', async t => {
    const selector = Selector('div')
        .filter('.filtered')

    await t.click(selector);
});
