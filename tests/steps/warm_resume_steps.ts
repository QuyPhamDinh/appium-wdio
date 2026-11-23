import { Given, When, Then } from '@wdio/cucumber-framework';
import TabBar from '../screenobjects/components/TabBar.js';
import FormsScreen from '../screenobjects/FormsScreen.js';
import { activateDemoApp, sendAppToBackground } from '../helpers/Utils.js';
import { BUNDLE_ID, PACKAGE_NAME } from '../helpers/Constants.js';

Given('the demo app is installed and launched', async () => {
    await TabBar.waitForTabBarShown();
});

Given('I am on the Forms screen', async () => {
    await TabBar.openForms();
    await FormsScreen.waitForIsShown(true);
});

When(/^I have entered "([^"]*)" in the text input$/, async (text:string) => {
    await FormsScreen.input.setValue(text);
});

Given('the text input is initially empty', async () => {
    await FormsScreen.input.setValue('');
});

Given('the form switch is initially off', async () => {
    if (await FormsScreen.isSwitchActive()) {
        await FormsScreen.tapOnSwitch();
    }
    await expect(await FormsScreen.isSwitchActive()).toBe(false);
});

When(/^I enter "([^"]*)" in the text input$/, async (text:string) => {
    await FormsScreen.input.setValue(text);
});

When('I turn on the form switch', async () => {
    if (!(await FormsScreen.isSwitchActive())) {
        await FormsScreen.tapOnSwitch();
    }
    await expect(await FormsScreen.isSwitchActive()).toBe(true);
});

Given('the form switch is initially on', async () => {
    if (!(await FormsScreen.isSwitchActive())) {
        await FormsScreen.tapOnSwitch();
    }
    await expect(await FormsScreen.isSwitchActive()).toBe(true);
});

When('I turn off the form switch', async () => {
    if (await FormsScreen.isSwitchActive()) {
        await FormsScreen.tapOnSwitch();
    }
});

When('I swipe up to open the iOS App Switcher', async () => {
    await sendAppToBackground();
});

When('I open the Android Recents screen', async () => {
    await driver.pressKeyCode(187);
    await driver.pause(3000);
});

When('I select the demo app', async () => {
    await activateDemoApp(driver.isAndroid ? PACKAGE_NAME : BUNDLE_ID);
});

When('I go to the device Home screen', async () => {
    await sendAppToBackground();
});

When('I send the app to the background', async () => {
    await sendAppToBackground();
});

When('the Android system kills the app process', async () => {
    await driver.execute('mobile: terminateApp', { appId: PACKAGE_NAME });
});

When('I reopen the demo app', async () => {
    await activateDemoApp(PACKAGE_NAME);
});

When('I terminate the demo app', async () => {
    await driver.execute('mobile: terminateApp', { bundleId: BUNDLE_ID });
});

When('I relaunch the demo app', async () => {
    await activateDemoApp(BUNDLE_ID);
});

When('I return to the Forms screen', async () => {
    await TabBar.openForms();
    await FormsScreen.waitForIsShown(true);
});

When('I return to the running demo app', async () => {
    await activateDemoApp(driver.isAndroid ? PACKAGE_NAME : BUNDLE_ID);
});

Then('the Forms screen is visible', async () => {
    await FormsScreen.waitForIsShown(true);
});

Then(/^the text input contains "([^"]*)"$/, async (text:string) => {
    await expect(await FormsScreen.input.getText()).toBe(text);
});

Then('the text input is empty', async () => {
    if (driver.isAndroid) {
        const text = await FormsScreen.input.getAttribute('text');
        const hint = await FormsScreen.input.getAttribute('hint');
        await expect(text === '' || text === hint).toBe(true);
        return;
    }

    const text = await FormsScreen.input.getText();
    await expect(text === '' || text === 'Type something').toBe(true);
});

Then('the form switch is on', async () => {
    await expect(await FormsScreen.isSwitchActive()).toBe(true);
});

Then('the form switch is off', async () => {
    await expect(await FormsScreen.isSwitchActive()).toBe(false);
});
