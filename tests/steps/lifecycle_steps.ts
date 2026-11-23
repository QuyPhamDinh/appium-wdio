import { Given, When } from '@wdio/cucumber-framework';
import TabBar from '../screenobjects/components/TabBar.js';
import { activateDemoApp, getAppId, sendAppToBackground } from '../helpers/Utils.js';

const ANDROID_APP_STATE = {
    BACKGROUND: 3,
};

async function getAndroidAppPids(appId: string): Promise<string> {
    const output = await driver.execute('mobile: shell', {
        command: 'ps',
        args: ['-A', '-o', 'PID,NAME'],
    });
    return String(output)
        .trim()
        .split('\n')
        .map((line) => line.trim().split(/\s+/, 2))
        .filter(([, name]) => name === appId || name?.startsWith(`${appId}:`))
        .map(([pid]) => pid)
        .join(' ');
}

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
    const initialPids = await getAndroidAppPids(appId);
    let currentPids = initialPids;
    try {
        await driver.waitUntil(async () => {
            await driver.execute('mobile: shell', { command: 'am', args: ['kill', appId] });
            currentPids = await getAndroidAppPids(appId);
            return currentPids === '';
        }, { timeout: 12000, interval: 1000 });
    } catch (cause) {
        const reason = cause instanceof Error ? cause.message : String(cause);
        throw new Error(
            `Could not stop ${appId} with am kill (initial PIDs: ${initialPids || 'none'}, last seen PIDs: ${currentPids || 'none'}). ${reason}`,
        );
    }
});

When('I terminate the demo app', async () => {
    await driver.execute('mobile: terminateApp', { bundleId: getAppId() });
});

When('I activate the demo app', async () => {
    await activateDemoApp(getAppId());
});
