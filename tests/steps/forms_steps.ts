import { Given, When, Then } from '@wdio/cucumber-framework';
import TabBar from '../screenobjects/components/TabBar.js';
import FormsScreen from '../screenobjects/FormsScreen.js';

Given('I am on the Forms screen', async () => {
    await TabBar.waitForTabBarShown();
    await TabBar.openForms();
    await FormsScreen.waitForIsShown(true);
});

// The iOS helper sends and verifies each character separately.
When(/^(?:I have entered|I enter) "([^"]*)" in the text input$/, { timeout: 90000 }, async (text: string) => {
    await FormsScreen.typeInput(text);
});

Given('the text input is initially empty', async () => {
    await FormsScreen.typeInput('');
});

Given('the form switch is initially off', async () => {
    await FormsScreen.setSwitch(false);
});

When('I turn on the form switch', async () => {
    await FormsScreen.setSwitch(true);
});

Given('the form switch is initially on', async () => {
    await FormsScreen.setSwitch(true);
});

When('I turn off the form switch', async () => {
    await FormsScreen.setSwitch(false);
});

When('I return to the Forms screen', async () => {
    await TabBar.openForms();
    await FormsScreen.waitForIsShown(true);
});

Then('the Forms screen is visible', async () => {
    await FormsScreen.waitForIsShown(true);
});

Then(/^the text input contains "([^"]*)"$/, async (text:string) => {
    await expect(FormsScreen.input).toHaveText(text, { trim: false });
});

Then('the text input is empty', async () => {
    await FormsScreen.waitUntilInputEmpty();
});

Then('the form switch is on', async () => {
    await FormsScreen.expectSwitchActive(true);
});

Then('the form switch is off', async () => {
    await FormsScreen.expectSwitchActive(false);
});
