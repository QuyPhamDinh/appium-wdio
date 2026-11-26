import { APP_CONFIG } from '../helpers/AppConfig.js';
import WebView from '../helpers/WebView.js';

class WebViewScreen extends WebView {
    constructor () {
        super({
            urlMatch: APP_CONFIG.webviewUrl,
            titleMatch: APP_CONFIG.webviewTitlePattern,
        });
    }

    /**
     * Wait for the screen to be displayed based on Xpath
     */
    async waitForWebViewIsDisplayedByXpath (isShown = true): Promise<boolean|void> {
        const selector =  browser.isAndroid ? '*//android.webkit.WebView' : '*//XCUIElementTypeWebView';

        return $(selector).waitForDisplayed({
            timeout: 45000,
            reverse: !isShown,
        });
    }
}

export default new WebViewScreen();
