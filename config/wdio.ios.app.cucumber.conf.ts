import path from 'node:path';
import url from 'node:url';
import { config as appConfig } from './wdio.ios.app.conf.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const cucumberBaseConfig = { ...appConfig };
delete cucumberBaseConfig.mochaOpts;

export const config: WebdriverIO.Config = {
    ...cucumberBaseConfig,
    specs: ['../tests/features/**/*.feature'],
    framework: 'cucumber',
    cucumberOpts: {
        tags: '@ios',
        require: [path.join(__dirname, '..', 'tests', 'steps', '**', '*.ts')],
        backtrace: false,
        compiler: [],
        dryRun: false,
        failFast: false,
        snippets: true,
        source: true,
        strict: true,
        timeout: 20000,
        ignoreUndefinedDefinitions: false,
        scenarioLevelReporter: false,
    },
};
