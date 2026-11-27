import AppScreen from './AppScreen.js';
import { dismissKeyboardIfShown, typeSecureText, typeText } from '../helpers/Utils.js';

const SELECTORS = {
    SCREEN: '~Login-screen',
};

class LoginScreen extends AppScreen {
    constructor () {
        super(SELECTORS.SCREEN);
    }

    get screen () {return $(SELECTORS.SCREEN);}
    private get headerText () {
        return $(driver.isIOS
            ? '-ios predicate string:type == "XCUIElementTypeStaticText" AND name == "Login / Sign up Form"'
            : '//*[@text="Login / Sign up Form"]');
    }
    private get loginContainerButton () {return $('~button-login-container');}
    private get signUpContainerButton () {return $('~button-sign-up-container');}
    private get loginButton () {return $('~button-LOGIN');}
    private get signUpButton () {return $('~button-SIGN UP');}
    private get email () {return $('~input-email');}
    private get password () {return $('~input-password');}
    private get repeatPassword () {return $('~input-repeat-password');}
    private get biometricButton () {return $('~button-biometric');}

    async isBiometricButtonDisplayed () {
        return this.biometricButton.isDisplayed();
    }

    async tapOnLoginContainerButton(){
        await this.loginContainerButton.click();
        await this.repeatPassword.waitForDisplayed({ reverse: true });
    }

    async tapOnSignUpContainerButton(){
        await this.signUpContainerButton.click();
        await this.repeatPassword.waitForDisplayed();
    }

    async tapOnBiometricButton(){
        await this.biometricButton.click();
    }

    private async submitForm(submitButton: ChainablePromiseElement) {
        const dismissTarget = (await this.headerText.isDisplayed()) ? this.headerText : this.screen;
        await dismissKeyboardIfShown(dismissTarget);
        if (driver.isIOS && (await driver.isKeyboardShown())) {
            await driver.waitUntil(async () => !(await driver.isKeyboardShown()), {
                timeout: 2000,
                interval: 100,
            }).catch(() => undefined);
        }
        // On smaller screens there could be a possibility that the button is not shown
        // This uses the "new" `scrollIntoView` method that now also supports native apps
        await submitButton.scrollIntoView({
            scrollableElement: await this.screen,
        });
        await submitButton.waitForDisplayed();
        await submitButton.click();
    }

    async submitLoginForm({ username, password }:{username:string; password:string;}) {
        await typeText(this.email, username);
        await typeSecureText(this.password, password);
        await this.submitForm(this.loginButton);
    }

    async submitSignUpForm({ username, password }:{username:string; password:string;}) {
        await typeText(this.email, username);
        await typeSecureText(this.password, password);
        await typeSecureText(this.repeatPassword, password);
        await this.submitForm(this.signUpButton);
    }
}

export default new LoginScreen();
