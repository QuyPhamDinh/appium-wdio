import { Given, When, Then } from '@wdio/cucumber-framework';
import TabBar from '../screenobjects/components/TabBar.js';
import FormsScreen from '../screenobjects/FormsScreen.js';

Given('I am on the Forms screen', async () => {
    await TabBar.openForms();
    await FormsScreen.waitForIsShown(true);
});

When(/^(?:I have entered|I enter) "([^"]*)" in the text input$/, async (text: string) => {
    await FormsScreen.input.setValue(text);
});

Given('the text input is initially empty', async () => {
    await FormsScreen.input.setValue('');
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
    await expect(await FormsScreen.input.getText()).toBe(text);
});

Then('the text input is empty', async () => {
    await expect(await FormsScreen.isInputEmpty()).toBe(true);
});

Then('the form switch is on', async () => {
    await expect(await FormsScreen.isSwitchActive()).toBe(true);
});

Then('the form switch is off', async () => {
    await expect(await FormsScreen.isSwitchActive()).toBe(false);
});
