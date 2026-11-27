import TabBar from '../screenobjects/components/TabBar.js';
import LoginScreen from '../screenobjects/LoginScreen.js';
import Biometrics from '../helpers/Biometrics.js';
import NativeAlert from '../screenobjects/components/NativeAlert.js';
import AndroidSettings from '../screenobjects/AndroidSettings.js';
import { executeInHomeScreenContext, getAppId, relaunchApp } from '../helpers/Utils.js';
import { BUNDLE_ID, PACKAGE_NAME } from '../helpers/Constants.js';

/**
 * IMPORTANT!
 * To verify if Touch/FaceID for iOS and FingerPrint for Android work we need to verify if they are enabled. This can be done by verifying
 * if the biometrics button is shown. If not shown we need to enabled it.
 * For iOS it's pretty straightforward, but for Android is more complex. There is a helper (Android Settings) that will handle all steps for
 * you for Android 9.0 (2018) till the latest version of Android.
 */
describe('WebdriverIO and Appium, when interacting with a biometric button,', () => {
    let isFirstTest = true;

    beforeEach(async () => {
        if (!isFirstTest) {
            await relaunchApp(getAppId());
        }
        isFirstTest = false;
        await goToLoginPage();

        // If the biometry is not shown on iOS, enable it on the phone
        if (driver.isIOS && !(await LoginScreen.isBiometricButtonDisplayed())) {
            // iOS us pretty straightforward, just enabled it
            await driver.toggleEnrollTouchId(true);
            // restart the app
            await relaunchApp(BUNDLE_ID);

            // Wait for the app again and go to the login screen
            await goToLoginPage();
        } else if (driver.isAndroid && !(await LoginScreen.isBiometricButtonDisplayed())) {
            // Android is more complex, see this method
            await AndroidSettings.enableBiometricLogin();
            // restart the app
            await relaunchApp(PACKAGE_NAME);

            // Wait for the app again and go to the login screen
            await goToLoginPage();
        }
    });

    after(async () => {
        if (driver.isAndroid) {
            await AndroidSettings.restoreAfterBiometricLogin();
        }
    });

    it('should be able to login with a matching touch/faceID/fingerprint', async () => {
        // Always make sure you are on the right tab
        await LoginScreen.tapOnLoginContainerButton();
        // Press the touch/faceID/Fingerprint button
        await LoginScreen.tapOnBiometricButton();
        // This method will successfully handle the biometric login for OR Android, OR iOS.
        await Biometrics.submitBiometricLogin(true);
        // Wait for the alert and validate it
        await NativeAlert.waitForIsShown();
        await NativeAlert.waitForTextToContain('Success');

        if (driver.isIOS) {
            // Wait for the SpringBoard Face ID / Touch ID overlay to disappear before dismissing the app alert
            await executeInHomeScreenContext(async () => {
                const prompt = $('-ios predicate string:type == "XCUIElementTypeStaticText" AND (name == "Face ID" OR name BEGINSWITH "Touch ID")');
                await prompt.waitForDisplayed({ reverse: true, timeout: 5000 });
            });
        }

        // Close the alert
        await NativeAlert.topOnButtonWithText('OK');
        await NativeAlert.waitForIsShown(false);
    });

    it('should NOT be able to login with a non matching touch/faceID/fingerprint', async () => {
        // Always make sure you are on the right tab
        await LoginScreen.tapOnLoginContainerButton();
        // Press the touch/faceID/Fingerprint button
        await LoginScreen.tapOnBiometricButton();
        // This method will let the biometric login for OR Android, OR iOS fail.
        await Biometrics.submitBiometricLogin(false);

        // Android doesn't show an alert, but keeps the "use fingerprint" native modal in the screen
        if (driver.isIOS) {
            // NOTE:
            // With `appium-xcuitest-driver` V6 and higher this alert can't by default be detected by Appium. To work around this
            // we switch to the home screen context and accept the alert there.
            // This is a workaround for the issue described here:
            await executeInHomeScreenContext(async () => {
                // Wait for the alert and validate it
                await NativeAlert.waitForIsShown();
                // There's the English and US version of the "Not Recognized|Not Recognised"" text, so we just check for "Not Recogni
                await NativeAlert.waitForTextToContain('Not Recogni');

                // Close the alert
                await NativeAlert.topOnButtonWithText('Cancel');
                await NativeAlert.waitForIsShown(false);
            });
        } else {
            await AndroidSettings.waitAndTap('Cancel');
            // @TODO: This takes very long, need to fix this
            await (await AndroidSettings.findAndroidElementByMatchingText('Cancel')).waitForDisplayed({ reverse:true });
            await NativeAlert.waitForIsShown(false);
        }
    });
});

/**
 * Go to the login screen
 */
async function goToLoginPage(){
    await TabBar.waitForTabBarShown();
    await TabBar.openLogin();
    await LoginScreen.waitForIsShown(true);
}
