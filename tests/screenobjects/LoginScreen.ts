import AppScreen from './AppScreen.js';
import { dismissKeyboardIfShown } from '../helpers/Utils.js';

const SELECTORS = {
    SCREEN: '~Login-screen',
};

class LoginScreen extends AppScreen {
    constructor () {
        super(SELECTORS.SCREEN);
    }

    get screen () {return $(SELECTORS.SCREEN);}
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
    }

    async tapOnSignUpContainerButton(){
        await this.signUpContainerButton.click();
    }

    async tapOnBiometricButton(){
        await this.biometricButton.click();
    }

    private async submitForm(submitButton: ChainablePromiseElement) {
        await dismissKeyboardIfShown(this.screen);
        // On smaller screens there could be a possibility that the button is not shown
        // This uses the "new" `scrollIntoView` method that now also supports native apps
        await submitButton.scrollIntoView({
            scrollableElement: await this.screen,
        });
        await submitButton.click();
    }

    async submitLoginForm({ username, password }:{username:string; password:string;}) {
        await this.email.setValue(username);
        await this.password.setValue(password);
        await this.submitForm(this.loginButton);
    }

    async submitSignUpForm({ username, password }:{username:string; password:string;}) {
        await this.email.setValue(username);
        await this.password.setValue(password);
        await this.repeatPassword.setValue(password);
        await this.submitForm(this.signUpButton);
    }
}

export default new LoginScreen();
