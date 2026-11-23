import { Given, When } from '@wdio/cucumber-framework';
import TabBar from '../screenobjects/components/TabBar.js';
import { activateDemoApp, getAppId, sendAppToBackground } from '../helpers/Utils.js';

const ANDROID_APP_STATE = {
    NOT_RUNNING: 1,
    BACKGROUND: 3,
};

Given('the demo app is installed and launched', async () => {
    await TabBar.waitForTabBarShown();
});

When('I open the Android Recents screen', async () => {
    const appId = getAppId();
    await driver.pressKeyCode(187);
    await driver.waitUntil(async () =>
        await driver.execute('mobile: queryAppState', { appId }) === ANDROID_APP_STATE.BACKGROUND,
    { timeout: 5000, timeoutMsg: 'The demo app did not move to the background after opening Recents' });
});

When('I send the app to the background', async () => {
    await sendAppToBackground();
});

When('I kill the background Android app process', async () => {
    const appId = getAppId();
    await driver.waitUntil(async () =>
        await driver.execute('mobile: queryAppState', { appId }) === ANDROID_APP_STATE.BACKGROUND,
    { timeout: 5000, timeoutMsg: 'The demo app did not move to the background before am kill' });
    await driver.execute('mobile: shell', { command: 'am', args: ['kill', appId] });
    await driver.waitUntil(async () =>
        await driver.execute('mobile: queryAppState', { appId }) === ANDROID_APP_STATE.NOT_RUNNING,
    { timeout: 5000, timeoutMsg: 'The demo app process was still running after am kill' });
});

When('I terminate the demo app', async () => {
    await driver.execute('mobile: terminateApp', { bundleId: getAppId() });
});

When('I activate the demo app', async () => {
    await activateDemoApp(getAppId());
});
