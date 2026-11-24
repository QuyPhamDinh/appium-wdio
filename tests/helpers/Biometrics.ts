import { DEFAULT_PIN, INCORRECT_PIN } from './Constants.js';
import { executeInHomeScreenContext } from './Utils.js';

class Biometrics {
    private get iosAllowBiometry() {return $('~Don’t Allow');}
    private get allowBiometry() {return $('-ios class chain:**/XCUIElementTypeButton[`name == "Allow" OR name=="OK"`]');}
    private get androidBiometryAlert() {
        const regex = '(Please log in|Login with.*)';

        return $(`android=new UiSelector().textMatches("${regex}")`);
    }

    /**
     * Submit biometric login
     */
    async submitBiometricLogin(successful: boolean) {
        // Touch / Face ID needs to be triggered differently on iOS
        if (driver.isIOS) {
            return this.submitIosBiometricLogin(successful);
        }

        return this.submitAndroidBiometricLogin(successful ? DEFAULT_PIN : INCORRECT_PIN);
    }

    /**
     * Submit iOS biometric login
     */
    async submitIosBiometricLogin(successful: boolean) {
        const type = await executeInHomeScreenContext(async () => {
            const prompt = $('-ios predicate string:type == "XCUIElementTypeStaticText" AND (name == "Face ID" OR name BEGINSWITH "Touch ID")');
            await driver.waitUntil(async () => {
                if (await this.iosAllowBiometry.isDisplayed()) {
                    await this.allowBiometry.click();
                    return false;
                }
                return prompt.isDisplayed();
            }, {
                timeout: 10000,
                interval: 250,
                timeoutMsg: 'The iOS biometric authentication prompt did not appear',
            });
            return (await prompt.getAttribute('name')) === 'Face ID' ? 'faceId' : 'touchId';
        });
        await driver.execute('mobile: sendBiometricMatch', { type, match: successful });
    }

    /**
     * Submit Android biometric login
     */
    async submitAndroidBiometricLogin(fingerprintId:number) {
        await this.androidBiometryAlert.waitForDisplayed({ timeout: 10 *1000 });

        await driver.fingerPrint(fingerprintId);
    }
}

export default new Biometrics();
