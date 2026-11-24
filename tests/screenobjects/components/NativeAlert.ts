const ALERT_TIMEOUT = process.env.GITHUB_ACTIONS === 'true' ? 20000 : 11000;

const SELECTORS = {
    ANDROID: {
        ALERT_TITLE: '*//android.widget.TextView[@resource-id="com.wdiodemoapp:id/alert_title"]',
        ALERT_MESSAGE: '*//android.widget.TextView[@resource-id="android:id/message"]',
        ALERT_BUTTON: '*//android.widget.Button[@text="{BUTTON_TEXT}"]',
    },
    IOS: {
        ALERT: '-ios predicate string:type == \'XCUIElementTypeAlert\'',
    },
};

class NativeAlert {
    /**
     * Wait for the alert to exist.
     *
     * The selector for Android differs from iOS
     */
    static async waitForIsShown (isShown = true) {
        const selector = driver.isAndroid
            ? SELECTORS.ANDROID.ALERT_TITLE
            : SELECTORS.IOS.ALERT;

        return $(selector).waitForExist({
            timeout: ALERT_TIMEOUT,
            reverse: !isShown,
        });
    }

    /**
     * Press a native alert button by its label.
     */
    static async topOnButtonWithText (selector: string) {
        if (driver.isIOS) {
            // Retry a missed tap and confirm the alert has closed.
            await driver.waitUntil(async () => {
                if (!(await $(SELECTORS.IOS.ALERT).isExisting())) {
                    return true;
                }
                await driver.execute('mobile: alert', { action: 'accept', buttonLabel: selector });
                return false;
            }, {
                timeout: ALERT_TIMEOUT,
                interval: 1000,
                timeoutMsg: `iOS alert still present after trying to press "${selector}"`,
            });
            return;
        }

        const buttonSelector = SELECTORS.ANDROID.ALERT_BUTTON.replace(/{BUTTON_TEXT}/, selector.toUpperCase());
        await $(buttonSelector).click();
    }

    /**
     * Get the alert text
     *
     * iOS:
     *  The default Appium method can be used to get the text of the alert
     * Android:
     *  The UI hierarchy for Android is different so it will not give the same result as with
     *  iOS if `getText` is being used. Here we construct a method that would give the same output.
     */
    static async text ():Promise<string> {
        if (driver.isIOS) {
            return $(SELECTORS.IOS.ALERT).getText();
        }

        return `${await $(SELECTORS.ANDROID.ALERT_TITLE).getText()}\n${await $(SELECTORS.ANDROID.ALERT_MESSAGE).getText()}`;
    }
}

export default NativeAlert;
