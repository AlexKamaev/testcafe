import { t, Selector } from 'testcafe'

fixture`Switch_Window`

test(`Switch_PreviousWindow`, async tn => {
    await t.navigateTo("https://www.verizon.com/").maximizeWindow()
    await t.openWindow("https://www.verizon.com/")
    await t.switchToPreviousWindow()

    await t.click(Selector('[aria-label="Shop Menu List"]').nth(0))
    await t.click(Selector('[href="/deals/"]'))

    await t.switchToPreviousWindow()
    await t.click(Selector('[aria-label="Shop Menu List"]').nth(0))
    await t.click(Selector('[href="/deals/"]'))
    await t.switchToPreviousWindow();
})
