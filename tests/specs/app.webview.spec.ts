import TabBar from "../screenobjects/components/TabBar.js";
import WebViewScreen from "../screenobjects/WebviewScreen.js";
import SwipeScreen from "../screenobjects/SwipeScreen.js";
import { CONTEXT_REF } from "../helpers/WebView.js";

describe("WebdriverIO and Appium, when interacting with a WebView,", () => {
    // For now we exclude this file for iOS. There is an issue with the current EXPO app
    // which lead to a new feature request for WebdriverIO. We first need to implement that
    // before we can run this test on iOS.
    // BUT!!!: This is only for this new WebdriverIO app, not for the old one or your app.
    // So please take a look at this code to see how you could use WebViews and context switching
    // for your app.
    if (driver.isAndroid) {
        it("should be able to switch between webview, native and webview", async () => {
            await TabBar.waitForTabBarShown();
            await TabBar.openWebView();
            await WebViewScreen.switchToWebsite();

            // Open the search options
            await $(".DocSearch").click();
            // Wait for the search box to be there
            // We don't put an expect here because the wait for will fail if the element is not there.
            // This means this is already an "indirect" expectation
            await $(".DocSearch-Input").waitForDisplayed();
            await driver.pause(5000);
            // Hide the keyboard if shown
            if (await driver.isKeyboardShown()) {
                /**
                 * Normally we would hide the keyboard with this command `driver.hideKeyboard()`, but there is an issue for hiding the keyboard
                 * on iOS when using the command. You will get an error like below
                 *
                 *  Request failed with status 400 due to Error Domain=com.facebook.WebDriverAgent Code=1 "The keyboard on iPhone cannot be
                 *  dismissed because of a known XCTest issue. Try to dismiss it in the way supported by your application under test."
                 *  UserInfo={NSLocalizedDescription=The keyboard on iPhone cannot be dismissed because of a known XCTest issue. Try to dismiss
                 *  it in the way supported by your application under test.}
                 *
                 * That's why we click on the footer
                 */
                await $(".DocSearch-Footer").click();
            }

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
        });
    }
});
