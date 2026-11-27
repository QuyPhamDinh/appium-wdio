import Page from './page.js';
import { dismissKeyboardIfShown } from '../helpers/Utils.js';

class FormPage extends Page {
    /**
     * define elements
     */
    get username () { return $('#username'); }
    get password () { return $('#password'); }
    get submitButton () { return $('#login button[type=submit]'); }
    get flash () { return $('#flash'); }

    /**
     * a method to encapsule automation code to interact with the page
     * e.g. to login using username and password
     */
    async login ({ username, password }: {username:string; password: string;}) {
        await this.username.setValue(username);
        await this.password.setValue(password);
        await dismissKeyboardIfShown($('h2'));
        await this.submitButton.click();
    }

    /**
     * define or overwrite page methods
     */
    async open(): Promise<void> {
        return super.open('login');
    }
}

export default new FormPage();
