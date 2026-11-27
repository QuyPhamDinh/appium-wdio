import AppScreen from './AppScreen.js';
import { typeText } from '../helpers/Utils.js';

const SELECTORS = {
    SCREEN: '~Forms-screen',
};

class FormsScreen extends AppScreen {
    constructor () {
        super(SELECTORS.SCREEN);
    }

    get screen () {return $(SELECTORS.SCREEN);}
    get input () {return $('~text-input');}
    get inputTextResult () {return $('~input-text-result');}
    get switch () {return $('~switch');}
    get switchText () {return $('~switch-text');}
    get dropDown() { return $('~Dropdown'); }
    get dropDownChevron() { return $('~dropdown-chevron'); }
    get activeButton () {return $('~button-Active');}
    get inActiveButton () {return $('~button-Inactive');}

    async typeInput(text: string): Promise<void> {
        const input = this.input;
        await typeText(input, text);

        if (text === '') {
            await this.waitUntilInputEmpty();
            return;
        }

        await expect(input).toHaveText(text, { trim: false });
    }

    async waitUntilInputEmpty(timeout = 5000): Promise<void> {
        await driver.waitUntil(async () => this.isInputEmpty(), {
            timeout,
            interval: 200,
            timeoutMsg: 'Expected Forms text input to be empty',
        });
    }

    async isInputEmpty(): Promise<boolean> {
        if (driver.isAndroid) {
            const text = await this.input.getAttribute('text');
            const hint = await this.input.getAttribute('hint');
            return text === '' || text === hint;
        }

        const text = await this.input.getText();
        return text === '' || text === 'Type something';
    }

    async tapOnInputTextResult(){
        await this.inputTextResult.click();
    }

    async tapOnSwitch(){
        await this.switch.click();
    }

    async setSwitch(on: boolean) {
        if (await this.isSwitchActive() !== on) {
            await this.tapOnSwitch();
        }
        await driver.waitUntil(async () => await this.isSwitchActive() === on, {
            timeout: 5000,
            timeoutMsg: `The Forms switch did not turn ${on ? 'on' : 'off'}`,
        });
    }

    async tapOnDropDown() {
        // The tap action on the complete dropdown doesn't work on iOS, we need to
        // tap on the chevron to open it
        if (driver.isIOS) {
            return await this.dropDownChevron.click();
        }

        return await this.dropDown.click();
    }

    async tapOnActiveButton(){
        await this.activeButton.click();
    }

    async tapOnInActiveButton(){
        await this.inActiveButton.click();
    }

    /**
     * Return if the switch is active or not active for iOS / Android
     * For Android the switch is `"true"|"false"`, for iOS '1|0'
     */
    async isSwitchActive ():Promise<boolean> {
        return driver.isAndroid ? (await this.switch.getAttribute('checked')) === 'true' : (await this.switch.getText()) === '1';
    }

    async expectSwitchActive (expected: boolean): Promise<void> {
        if (driver.isAndroid) {
            await expect(this.switch).toHaveAttribute('checked', String(expected));
            return;
        }

        await expect(this.switch).toHaveText(expected ? '1' : '0');
    }

    get dropDownValue () {
        const selector = driver.isAndroid
            ? '//*[@content-desc="Dropdown"]//android.widget.EditText'
            : '-ios class chain:**/*[`name == "Dropdown"`]/**/*[`name == "text_input"`]';

        return $(selector);
    }

    async expectDropDownToContain (expected: string): Promise<void> {
        await expect(this.dropDownValue).toHaveText(expect.stringContaining(expected));
    }

    /**
     * Get the text of the drop down component
     */
    async getDropDownText ():Promise<string> {
        return this.dropDownValue.getText();
    }
}

export default new FormsScreen();
