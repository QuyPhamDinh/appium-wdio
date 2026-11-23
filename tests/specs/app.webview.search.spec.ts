import TabBar from '../screenobjects/components/TabBar.js';
import WebViewScreen from '../screenobjects/WebviewScreen.js';

describe('WebdriverIO and Appium, when interacting with a WebView,', () => {
    if (driver.isAndroid) {
        it('should be able search for the url method and open it', async () => {
            await TabBar.waitForTabBarShown();
            await TabBar.openWebView();
            await WebViewScreen.switchToWebsite();

            await $('.DocSearch').click();
            await $('.DocSearch-Input').setValue('url');
            await driver.waitUntil(async () =>
                (await $('.DocSearch-HitsFooter').getText()).includes('See all')
            );
            await $('#docsearch-hits0-item-0 a').click();

            await $('h1').waitForDisplayed({ timeout: 3000 });
            await expect(await driver.getTitle()).toEqual('url | WebdriverIO');
        });
    }
});
