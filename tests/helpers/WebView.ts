import { PACKAGE_NAME } from './Constants.js';

export const CONTEXT_REF = {
    NATIVE_APP: 'NATIVE_APP',
    WEBVIEW: 'WEBVIEW',
} as const;
const DOCUMENT_READY_STATE = {
    COMPLETE: 'complete',
    INTERACTIVE: 'interactive',
    LOADING: 'loading',
};

type ContextInterface = {
    id: string;
    title?: string;
    url?: string;
}
type IosContext  = {
    bundleId: string;
    id: string;
    title: string;
    url: string;
}
type AndroidContext =  {
    packageName?: string;
    webviewPageId?: string;
    androidWebviewData?: {
        attached: boolean;
        empty: boolean;
        neverAttached: boolean;
        visible: boolean;
    }
}

/**
 * There is a huge difference between the Android and iOS implementation for WebViews. We'll start with explaining the iOS implementation.
 *
 * iOS:
 * - an iOS app can have MULTIPLE WebViews for one app, but only one can be active at the same time
 * - when you call the default `driver.getContexts()` method you will get back an array of strings with:
 *      - `NATIVE_APP`
 *      - 0-N Webviews with the name `WEBVIEW-{randomNumber}`
 * - the order will be random, so you can't rely on the order of the array
 * - the default method doesn't give you enough information to determine which webview you need to use,
 *   for example no title or url of the webview
 *
 * Android:
 * - an Android App can only have ONE WebView per app, but it can have multiple pages inside the WebView (in theory you can see them as multiple webviews)
 * - when you call the default `driver.getContexts()` method you will get back an array of strings with:
 *     - `NATIVE_APP`
 *    - `WEBVIEW-{packageName}`, if you have Chrome in the background you will also get back `WEBVIEW_com.android.chrome`
 * - the order will be random, so you can't rely on the order of the array
 * - the default method doesn't give you enough information to determine which webview you need to use,
 *   for example no title or url of the webview
 *
 * The below class will give you custom implementations for both Android and iOS to get the correct webview.
 * Please read the comments in the code for more information.
 */
class WebView {
    async switchToWebsite() {
        let selectedContext: { id: string; pageId?: string } | undefined;

        await driver.waitUntil(async () => {
            const contexts = await driver.getContexts({
                returnAndroidDescriptionData: true,
                returnDetailedContexts: true,
            });

            for (const entry of contexts) {
                const context = entry as ContextInterface;
                if (driver.isIOS) {
                    if ((entry as IosContext).bundleId === 'process-wdiodemoapp' && context.url !== 'about:blank') {
                        selectedContext = { id: context.id };
                        return true;
                    }
                } else {
                    const androidContext = entry as AndroidContext;
                    if (androidContext.packageName === PACKAGE_NAME &&
                        androidContext.androidWebviewData?.empty === false &&
                        androidContext.webviewPageId &&
                        /WebdriverIO.*/.test(context.title ?? '') &&
                        context.url?.includes('https://webdriver.io/')) {
                        selectedContext = { id: context.id, pageId: androidContext.webviewPageId };
                        return true;
                    }
                }
            }
            return false;
        }, {
            timeout: 45000,
            interval: 500,
            timeoutMsg: 'The WebdriverIO website context did not become available',
        });

        if (!selectedContext) {
            throw new Error('No WebView context was selected');
        }
        await driver.switchAppiumContext(selectedContext.id);
        if (selectedContext.pageId) {
            await driver.switchToWindow(selectedContext.pageId);
        }
    }

    /**
     * Selenium or Appium normally automatically wait for a page to be loaded, but this doesn't work for webviews.
     * This method can be called when you have switched to a webview and you want to be sure for the page to be fully loaded.
     */
    async waitForDocumentFullyLoaded () {
        await driver.waitUntil(
            // A webpage can have multiple states, the ready state is the one we need to have.
            // This looks like the same implementation as for the w3c implementation for `browser.url('https://webdriver.io')`
            // That command also waits for the readiness of the page, see also the w3c specs
            // https://www.w3.org/TR/webdriver/#dfn-waiting-for-the-navigation-to-complete
            async() => (await driver.execute(() => document.readyState)) === DOCUMENT_READY_STATE.COMPLETE,
            {
                timeout: 15000,
                timeoutMsg: 'Website not loaded',
                interval: 100,
            },
        );
    }

    /**
     * Wait for the website in the webview to be loaded
     */
    async waitForWebsiteLoaded () {
        await this.switchToWebsite();
        await this.waitForDocumentFullyLoaded();
        await driver.switchContext(CONTEXT_REF.NATIVE_APP);
    }
}

export default WebView;
