import TabBar from '../screenobjects/components/TabBar.js';
import WebViewScreen from '../screenobjects/WebviewScreen.js';
import SwipeScreen from '../screenobjects/SwipeScreen.js';
import { CONTEXT_REF } from '../helpers/WebView.js';
import { dismissKeyboardIfShown } from '../helpers/Utils.js';

describe('WebdriverIO and Appium, when interacting with a WebView,', () => {
    // For now we exclude this file for iOS. There is an issue with the current EXPO app
    // which lead to a new feature request for WebdriverIO. We first need to implement that
    // before we can run this test on iOS.
    // BUT!!!: This is only for this new WebdriverIO app, not for the old one or your app.
    // So please take a look at this code to see how you could use WebViews and context switching
    // for your app.
    const runWebViewTest = driver.isAndroid ? it : it.skip;
    runWebViewTest('should be able to switch between webview, native and webview', async function () {
        this.timeout(360000);
        try {
            await verifyWebViewRoundTrip();
        } catch (error) {
            if (!(error instanceof Error) || !/adbExec.*timed out/i.test(error.message)) {
                throw error;
            }

            console.warn(`Retrying WebView round trip in a fresh session after an ADB timeout: ${error.message}`);
            await driver.reloadSession();
            await verifyWebViewRoundTrip();
        }
    });
});

async function verifyWebViewRoundTrip() {
    await driver.switchContext(CONTEXT_REF.NATIVE_APP);
    await TabBar.waitForTabBarShown();
    await TabBar.openWebView();
    await WebViewScreen.switchToWebsite();

    // Open the search options
    await $('.DocSearch').click();
    // Wait for the search box to be usable
    const initialSearchInput = $('.DocSearch-Input');
    await initialSearchInput.waitForDisplayed();
    await initialSearchInput.waitForClickable();
    // Hide the keyboard if shown
    await dismissKeyboardIfShown($('.DocSearch-Footer'), { waitForClickable: true });

    // Now open the swipe screen and do some action there
    // This can only be done if webdriver.io is told to go to the native context
    await driver.switchContext(CONTEXT_REF.NATIVE_APP);
    await TabBar.openSwipe();
    await SwipeScreen.waitForIsShown();

    await TabBar.openWebView();
    await WebViewScreen.switchToWebsite();

    const searchInput = $('.DocSearch-Input');
    const searchButton = $('.DocSearch-Button');
    await driver.waitUntil(
        async () => await searchInput.isClickable() || await searchButton.isClickable(),
        { timeoutMsg: 'DocSearch did not become usable after returning to the WebView' },
    );
    if (!(await searchInput.isClickable())) {
        await searchButton.click();
    }
    await searchInput.waitForClickable();
    await searchInput.click();
    await searchInput.setValue('OCR Testing');
    const ocrResult = $('.DocSearch-Hit a[href*="/docs/ocr-testing/ocr-testing"]');
    await ocrResult.waitForClickable();
    await ocrResult.click();

    await expect($('header h1')).toHaveText('OCR Testing');
}
