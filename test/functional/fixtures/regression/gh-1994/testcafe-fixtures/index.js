import { Selector } from 'testcafe';

fixture('This is a demo to test multi-windows').page('www.change.org');

test.only('Log in to Paypal', async t => {
    await t
        .navigateTo('/p/the-world-send-matt-damon-to-mars-to-recover-opportunity/sponsors/new')
        .expect(Selector(`a[href*="/psf/share?source_location="]`).exists)
        .ok()
        .typeText(Selector('input[name=amount]'), '123', { replace: true });

    const emailAddressInput = Selector('[data-testid="input_email"]').filterVisible();
    const confirmationEmailInput = Selector('[data-testid="input_confirmation_email"]').filterVisible();
    await t
        .click(Selector(`[data-testid="payment-option-button-paypal"]`))
        .expect(Selector('.iframe-form-element').exists)
        .notOk()
        .typeText(emailAddressInput, 'email@email.com', { replace: true })
        .typeText(confirmationEmailInput, 'email@email.com', { replace: true })
        .typeText(Selector('[data-testid="input_first_name"]'), 'Some', { replace: true })
        .typeText(Selector('[data-testid="input_last_name"]'), 'User', { replace: true });

    const payWithPaypalButton = Selector('[data-funding-source="paypal"]');
    await t
        .switchToIframe(Selector('[data-testid="paypal-button"] iframe'))
        .expect(payWithPaypalButton.with({ visibilityCheck: true }).exists)
        .ok()
        .hover(payWithPaypalButton);

    await t.click(payWithPaypalButton)
        // .switchToMainWindow()
        // .expect(Selector('.form-error').find('p').visible)
        // .notOk();

    // await t.maximizeWindow();

    // await t.debug();

    // await t.debug();
    // PayPal Login Window
    await t
        .typeText(Selector('#email'), 'email@email.com')
        .click(Selector('#btnNext'))
        .typeText(Selector('#password'), 'password')
        .click(Selector('#btnLogin'));

    // await t.debug();

    // await t.switchToPreviousWindow();
    //
    // await t.debug();
});
