import { DEFAULT_PIN, PACKAGE_NAME } from '../helpers/Constants.js';
import { activateDemoApp } from '../helpers/Utils.js';

class AndroidSettings {
    private testPinSet = false;

    /**
     * Get the platform version
     */
    private get platformVersion(): number {
        return parseInt(
            ('platformVersion' in driver.capabilities ? driver.capabilities['platformVersion'] : '9') as string,
            10,
        );
    }

    /**
     * Enable the finger print through the wizard
     */
    private async fingerPrintWizard(pin: number) {
        // There is a difference in the order the wizard in Android 10+ is executed
        if (this.platformVersion >= 10) {
            await this.postAndroidTenFingerPrintSetup(pin);
        } else {
            await this.preAndroidTenFingerPrintSetup(pin);
        }

        await this.touchFingerPrintSensor(pin);
        await this.waitAndTap('DONE');
    }

    /**
     * Pre Android 10 finger print setup steps
     */
    private async preAndroidTenFingerPrintSetup(pin: number){
        await this.waitAndTap('NEXT');
        await this.reEnterPin(pin);
    }

    /**
     * Post Android 10 finger print setup steps
     */
    private async postAndroidTenFingerPrintSetup(pin: number){
        await this.reEnterPin(pin);
        if (this.platformVersion >= 14) {
            const pixelImprint = await this.findAndroidElementByMatchingText('Pixel Imprint');
            const moreButton = await this.findAndroidElementByMatchingText('MORE');
            await driver.waitUntil(async () =>
                await pixelImprint.isDisplayed() || await moreButton.isDisplayed(),
            { timeout: 10000, timeoutMsg: 'Android Fingerprint setup screen did not appear' });
            if (await pixelImprint.isDisplayed()) {
                await pixelImprint.click();
            }
        }
        if (this.platformVersion >= 12) {
            await this.waitAndTap('MORE');
            await this.waitAndTap('I AGREE');
        } else {
            await this.waitAndTap('NEXT');
        }
    }

    /**
     * Re-enter pin and submit screen
     */
    private async reEnterPin(pin: number) {
        await (await this.findAndroidElementByMatchingText('(Re-enter your PIN|Enter your device PIN)')).waitForDisplayed({ timeout: 10*1000 });
        await this.executeAdbCommand(`input text ${pin} && input keyevent 66`);
    }

    /**
     * Touch the fingerprint sensor and enable it
     */
    private async touchFingerPrintSensor(touchCode: number) {
        // Touch the sensor for the first time to trigger finger print
        await (await this.findAndroidElementByMatchingText('Touch the sensor.*')).waitForDisplayed({ timeout: 10*1000 });
        await driver.fingerPrint(touchCode);

        // Add finger print
        await (await this.findAndroidElementByMatchingText('Put your finger.*')).waitForDisplayed({ timeout: 10*1000 });
        await driver.fingerPrint(touchCode);

        // Confirm finger print
        await (await this.findAndroidElementByMatchingText('Keep lifting.*')).waitForDisplayed({ timeout: 10*1000 });
        await driver.fingerPrint(touchCode);
    }

    /**
     * Execute ADB commands on the device
     */
    private async executeAdbCommand(adbCommand: string) {
        await driver.execute('mobile: shell', {
            command: adbCommand,
        });
    }

    /**
     * Find an Android element based on text that matches a regular expression which is case insensitive
     */
    async findAndroidElementByMatchingText(string: string) {
        const selector = `android=new UiSelector().textMatches("(?i)${string}")`;

        return $(selector);
    }

    /**
     * Wait on an element
     */
    async waitForMatchingElement(string: string) {
        await (await this.findAndroidElementByMatchingText(string)).waitForDisplayed({ timeout: 10*1000 });
    }
    /**
     * Wait and click on an element
     */
    async waitAndTap(string: string) {
        await this.waitForMatchingElement(string);
        await (await this.findAndroidElementByMatchingText(string)).click();
    }

    /**
     * Close the settings Screen lock notifications
     */
    async closeSettingsScreenLockNotifications(){
        try {
            if (await (await this.findAndroidElementByMatchingText('Set screen lock')).isDisplayed()){
                await $('android=new UiSelector().descriptionContains("Dismiss")').click();
                await $('android=new UiSelector().textMatches("(?i)Dismiss")').click();
            }
        } catch { /* do nothing */ }
    }

    /**
     * This is the core methods to enable FingerPrint for Android. It will walk through all steps to enable
     * FingerPrint on Android 9 (2018) till the latest one all automatically for you.
     */
    async enableBiometricLogin() {
        // Set the PIN before opening Settings so the security screen starts with the new state.
        try {
            await driver.execute('mobile: shell', { command: 'locksettings', args: ['set-pin', String(DEFAULT_PIN)] });
        } catch {
            // Recover if DEFAULT_PIN was left set by an earlier aborted run or snapshot
            await driver.execute('mobile: shell', { command: 'locksettings', args: ['clear', '--old', String(DEFAULT_PIN)] });
            await driver.execute('mobile: shell', { command: 'locksettings', args: ['set-pin', String(DEFAULT_PIN)] });
        }
        this.testPinSet = true;
        await driver.execute('mobile: shell', { command: 'am', args: ['start', '-W', '-a', 'android.settings.SECURITY_SETTINGS'] });
        // As of Android 14 there is a new flow to enable finger print
        if (this.platformVersion >= 14) {
            // There might be two Device unlock options, the first is the notification, the second is the actual setting
            // First wait for the right screen to be shown
            await this.waitForMatchingElement('Device unlock.*');
            // Android 14 might have notifications that might block searching the right element, so we need to close them
            await this.closeSettingsScreenLockNotifications();
            await this.openDeviceUnlock();
            await this.waitAndTap('^(Face & )?Fingerprint( Unlock)?$');
        } else {
            await this.waitAndTap('.*Fingerprint.*');
        }
        await this.fingerPrintWizard(DEFAULT_PIN);
    }

    private async openDeviceUnlock() {
        const fingerprintOption = await this.findAndroidElementByMatchingText('^(Face & )?Fingerprint( Unlock)?$');
        await driver.waitUntil(async () => {
            if (await fingerprintOption.isDisplayed()) {
                return true;
            }
            const deviceUnlock = await this.findAndroidElementByMatchingText('Device unlock');
            if (await deviceUnlock.isDisplayed()) {
                try {
                    await deviceUnlock.click();
                } catch (error) {
                    if (!(error instanceof Error) || !/stale element reference|does not exist in DOM anymore/i.test(error.message)) {
                        throw error;
                    }
                }
            }
            return fingerprintOption.isDisplayed();
        }, { timeout: 15000, timeoutMsg: 'Android Settings did not open Device unlock' });
    }

    async restoreAfterBiometricLogin() {
        if (!this.testPinSet) {
            return;
        }
        try {
            await driver.execute('mobile: shell', { command: 'locksettings', args: ['clear', '--old', String(DEFAULT_PIN)] });
            this.testPinSet = false;
        } finally {
            await activateDemoApp(PACKAGE_NAME);
        }
    }
}

export default new AndroidSettings();
