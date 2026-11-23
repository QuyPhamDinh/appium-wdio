import { config as appConfig } from './wdio.android.app.conf.js';
import path from 'node:path';
import url from 'node:url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const cucumberBaseConfig = { ...appConfig };
delete cucumberBaseConfig.mochaOpts;

export const config: WebdriverIO.Config = {
    ...cucumberBaseConfig,

    // ============
    // Specs
    // ============
    specs: ['../tests/features/**/*.feature'],
    // ============
    // Framework
    // ============
    // By default we use the Mocha framework, see the `wdio.shared.conf.ts` which is imported by `./wdio.shared.local.appium.conf.js`. For Cucumber we need to "redefine" the framework
    framework: 'cucumber',
    //
    // You also need to specify where your step definitions are located.
    // See also: https://github.com/webdriverio/webdriverio/tree/main/packages/wdio-cucumber-framework#cucumberopts-options
    cucumberOpts: {
        tags: '@android',
        require: [path.join(__dirname, '..', 'tests', 'steps', '**', '*.ts')],
        backtrace: false, // <boolean> show full backtrace for errors
        compiler: [], // <string[]> ("extension:module") require files with the given EXTENSION after requiring MODULE (repeatable)
        dryRun: false, // <boolean> invoke formatters without executing steps
        failFast: false, // <boolean> abort the run on first failure
        snippets: true, // <boolean> hide step definition snippets for pending steps
        source: true, // <boolean> hide source URIs
        strict: true, // <boolean> fail if there are any undefined or pending steps
        timeout: 20000, // <number> timeout for step definitions
        ignoreUndefinedDefinitions: false, // <boolean> Enable this config to treat undefined definitions as warnings.
        scenarioLevelReporter: false, // Enable this to make webdriver.io behave as if scenarios and not steps were the tests.
    },
};
