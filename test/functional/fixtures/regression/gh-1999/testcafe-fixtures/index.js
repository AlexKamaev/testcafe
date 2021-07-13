import { Selector } from 'testcafe';

fixture `test`
    .page `http://kokhanovsky-w10/211/RegressionTestsSite/ASPxGridView/Visual_T864356/T864356_GridView_AllThemes.aspx?themeName=MaterialCompact`;

test('Run', async t => {
    await t.debug();

    await t.expect(t.eval(() => {
        debugger;

        return document.querySelectorAll(".dxflCaptionCell_MaterialCompact")[2].clientWidth
    })).eql(54)


});
