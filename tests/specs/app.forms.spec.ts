import TabBar from '../screenobjects/components/TabBar.js';
import FormScreen from '../screenobjects/FormsScreen.js';
import Picker from '../screenobjects/components/Picker.js';
import NativeAlert from '../screenobjects/components/NativeAlert.js';
import { getAppId, relaunchApp } from '../helpers/Utils.js';

describe('WebdriverIO and Appium, when interacting with form elements,', () => {
    let isFirstTest = true;

    beforeEach(async () => {
        if (!isFirstTest) {
            await relaunchApp(getAppId());
        }
        isFirstTest = false;
        await TabBar.waitForTabBarShown();
        await TabBar.openForms();
        await FormScreen.waitForIsShown(true);
    });

    it('should be able type in the input and validate the text', async () => {
        const text = 'Hello, this is a demo app';

        await FormScreen.typeInput(text);
        await expect(FormScreen.inputTextResult).toHaveText(
            expect.stringContaining(text)
        );
    });

    it('should be able turn on and off the switch', async () => {
        await FormScreen.expectSwitchActive(false);

        await FormScreen.tapOnSwitch();
        await FormScreen.expectSwitchActive(true);

        await FormScreen.tapOnSwitch();
        await FormScreen.expectSwitchActive(false);
    });

    it('should be able select a value from the select element', async () => {
        const valueOne = 'This app is awesome';
        const valueTwo = 'webdriver.io is awesome';
        const valueThree = 'Appium is awesome';

        await FormScreen.tapOnDropDown();
        await Picker.selectValue(valueOne);
        await FormScreen.expectDropDownToContain(valueOne);

        await FormScreen.tapOnDropDown();
        await Picker.selectValue(valueTwo);
        await FormScreen.expectDropDownToContain(valueTwo);

        await FormScreen.tapOnDropDown();
        await Picker.selectValue(valueThree);
        await FormScreen.expectDropDownToContain(valueThree);
    });

    it('should be able to open the alert and close it with all 3 buttons', async () => {
        // This uses the "new" `scrollIntoView` method that now also supports native apps
        await FormScreen.activeButton.scrollIntoView({
            maxScrolls: 2,
            scrollableElement: await FormScreen.screen,
        });
        await FormScreen.tapOnActiveButton();
        await NativeAlert.waitForIsShown(true);
        await NativeAlert.waitForTextToContain('This button is');

        /**
         * The following steps don't contain any assertions. This might look strange, but
         * the `waitForIsShown`-method is the verification. If the element is there, it will
         * click on it, and we can also verify if the element is not there. Both can be seen
         * as assertions so we don't need to do double assertions per action (wait for the element
         * to be there, and when it's there, expect that it's there)
         */
        await NativeAlert.tapOnButtonWithText('Ask me later');
        await NativeAlert.waitForIsShown(false);
        await FormScreen.tapOnActiveButton();
        await NativeAlert.waitForIsShown(true);
        await NativeAlert.tapOnButtonWithText('Cancel');
        await NativeAlert.waitForIsShown(false);
        await FormScreen.tapOnActiveButton();
        await NativeAlert.waitForIsShown(true);
        await NativeAlert.tapOnButtonWithText('OK');
        await NativeAlert.waitForIsShown(false);
    });

    it('should be able to determine that the inactive button is inactive', async () => {
        // Depending on the size of the screen we might need to scroll. This methods determines if it's visible,
        // if not, it will automatically scroll to find it. This will be done two times.
        // This uses the "new" `scrollIntoView` method that now also supports native apps
        await FormScreen.inActiveButton.scrollIntoView({
            maxScrolls: 2,
            scrollableElement: await FormScreen.screen,
        });
        // In this case the button can't be asked if it is active or not with
        // `expect(FormScreen.inActiveButton.isEnabled()).toEqual(false);`
        // So use a click and poll to confirm the alert does not appear
        await NativeAlert.waitForIsShown(false);
        await FormScreen.tapOnInActiveButton();
        let alertAppeared = false;
        try {
            await NativeAlert.waitForIsShown(true, 1000);
            alertAppeared = true;
        } catch (error) {
            if (!(error instanceof Error) || !/still not existing/i.test(error.message)) {
                throw error;
            }
        }
        expect(alertAppeared).toBe(false);
    });
});
