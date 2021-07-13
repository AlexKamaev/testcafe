
import { Selector, ClientFunction } from 'testcafe';

import pageModel from '../page-model';
// // eslint-disable-next-line no-duplicate-imports
// import * as kekeke from '../page-model';

fixture `My fixture`
    .page `http://example.com`;

test('Question/Doubt 1', async t => {
    debugger;
    // console.log(kekeke);
    //
    // await t.click(pageModel.getHeader());

    await t.click(pageModel.getHeader());
});
