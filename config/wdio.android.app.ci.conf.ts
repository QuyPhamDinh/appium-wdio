import { config as appConfig } from './wdio.android.app.conf.js';

export const config: WebdriverIO.Config = {
    ...appConfig,
    exclude: ['../tests/specs/app.biometric.login.spec.ts'],
};
