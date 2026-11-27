import CheckboxPage from '../pageobjects/checkbox.page.js';

describe('checkboxes', () => {
    it('checkbox 2 should be enabled',  async () => {
        await CheckboxPage.open();
        await CheckboxPage.firstCheckbox.waitForDisplayed({ timeout: 3000 });
        await expect(CheckboxPage.firstCheckbox).not.toBeChecked();
        await expect(CheckboxPage.lastCheckbox).toBeChecked();
    });

    it('checkbox 1 should be enabled after clicking on it',  async () => {
        await CheckboxPage.open();
        await CheckboxPage.firstCheckbox.waitForDisplayed({ timeout: 3000 });
        await expect(CheckboxPage.firstCheckbox).not.toBeSelected();
        await CheckboxPage.firstCheckbox.click();
        await expect(CheckboxPage.firstCheckbox).toBeSelected();
    });
});
