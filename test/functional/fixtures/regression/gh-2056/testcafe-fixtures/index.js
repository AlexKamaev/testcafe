import { Selector, ClientFunction } from 'testcafe';
import userAgent from 'useragent';

fixture `GH-2056`
    .page `http://localhost:3000/fixtures/regression/gh-2056/pages/index.html`;

const el1    = Selector('#el1');
const el2    = Selector('#el2');
const el3    = Selector('#el3');
const result = Selector('#result');

const getUserAgent = ClientFunction(() => navigator.userAgent.toString());

test('Move actions should provide correct button, buttons, which properties', async t => {
    var userAgentStr = await getUserAgent();
    var isChrome     = userAgent.is(userAgentStr).chrome;
    var expected     = isChrome ? 'onMove:000onMoveWithLeftButtonPressed:011' : 'onMove:001onMoveWithLeftButtonPressed:011';

    await t
        .setTestSpeed(0.1)
        .click(el1)
        .debug()
        .hover(el3)
        .click(el2)
        .dragToElement(el2, el3)
        .expect(result.innerText).eql(expected);
});
