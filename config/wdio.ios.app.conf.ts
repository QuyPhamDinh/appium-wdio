import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { Services } from '@wdio/types';
import { config as baseConfig } from './wdio.shared.local.appium.conf.js';

const isGitHubActions = process.env.GITHUB_ACTIONS === 'true';
const isAppPreinstalled = isGitHubActions && process.env.IOS_APP_PREINSTALLED === 'true';
const simulatorUdid = process.env.IOS_UDID;
const wdaDerivedDataPath = process.env.IOS_WDA_DERIVED_DATA_PATH;

const captureFailureScreenshot: NonNullable<Services.HookFunctions['afterTest']> = async (test, _context, { error }) => {
    if (!error) {
        return;
    }

    const directory = join('logs', 'screenshots');
    const title = test?.title?.replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 100) || 'failure';
    try {
        await mkdir(directory, { recursive: true });
        await driver.saveScreenshot(join(directory, `${title}-${randomUUID()}.png`));
    } catch (captureError) {
        console.warn(`Could not save a screenshot for ${title}`, captureError);
    }
};

export const config: WebdriverIO.Config = {
    ...baseConfig,
    ...(isGitHubActions && {
        connectionRetryTimeout: isAppPreinstalled ? 420000 : 300000,
        connectionRetryCount: 0,
        specFileRetries: 1,
        specFileRetriesDelay: 5,
        afterTest: captureFailureScreenshot,
        afterHook: captureFailureScreenshot,
    }),

    // ============
    // Specs
    // ============
    specs: ['../tests/specs/**/app*.spec.ts'],
    exclude: [
        // Android-only WebView specs (excluded on iOS at config level)
        '../tests/specs/**/app.webview.spec.ts',
        '../tests/specs/**/app.webview.search.spec.ts',
    ],

    // ============
    // Capabilities
    // ============
    // For all capabilities please check
    // http://appium.io/docs/en/writing-running-appium/caps/#general-capabilities
    capabilities: [
        {
            // The defaults you need to have in your config
            platformName: 'iOS',
            'wdio:maxInstances': 1,
            // For W3C the appium capabilities need to have an extension prefix
            // This is `appium:` for all Appium Capabilities which can be found here
            // http://appium.io/docs/en/writing-running-appium/caps/

            //
            // NOTE: Change this name according to the Simulator you have created on your local machine
            'appium:deviceName': process.env.IOS_DEVICE_NAME || 'iPhone 16 Pro',
            //
            // NOTE: Change this version according to the Simulator Version you have created on your local machine
            'appium:platformVersion': process.env.IOS_PLATFORM_VERSION || '18.2',
            ...(simulatorUdid && { 'appium:udid': simulatorUdid }),
            ...(wdaDerivedDataPath && {
                'appium:derivedDataPath': wdaDerivedDataPath,
                'appium:usePrebuiltWDA': true,
            }),
            ...(isAppPreinstalled && {
                'appium:noReset': true,
                'appium:shouldTerminateApp': true,
            }),
            ...(isGitHubActions && {
                'appium:isHeadless': true,
                'appium:wdaLaunchTimeout': 180000,
                'appium:wdaStartupRetries': 1,
                'appium:showXcodeLog': !wdaDerivedDataPath,
            }),
            'appium:orientation': 'PORTRAIT',
            'appium:automationName': 'XCUITest',
            // The path to the app
            'appium:app': join(
                process.cwd(),
                'apps',
                // Change this name according to the app version you downloaded
                'wdiodemoapp.app'
            ),
            'appium:bundleId': 'org.wdiodemoapp',
            'appium:newCommandTimeout': 240,
            // Webview detection capabilities for iOS 18.x
            // This is needed to wait for the webview context to become available
            'appium:webviewConnectTimeout': 20 * 1000,
            // Add process bundle IDs to match webviews (iOS uses process-{bundleId} format)
            // Using wildcard to match all webview processes, or specify: ["process-wdiodemoapp", "process-org.wdiodemoapp"]
            'appium:additionalWebviewBundleIds': ['*'],
            // There are some issues when typing that not all keys are sent. This is a workaround to slow down the typing.
            'appium:maxTypingFrequency': 30,
        },
    ],
};
