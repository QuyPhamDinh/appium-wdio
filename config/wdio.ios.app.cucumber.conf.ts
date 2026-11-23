import { join } from "node:path";
import path from "node:path";
import url from "node:url";
import { config as baseConfig } from "./wdio.shared.local.appium.conf.js";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
const { mochaOpts, ...cleanBaseConfig } = baseConfig;

export const config: WebdriverIO.Config = {
    ...cleanBaseConfig,
    specs: ["../tests/features/**/*.feature"],
    framework: "cucumber",
    cucumberOpts: {
        tags: "@ios",
        require: [path.join(__dirname, "..", "tests", "steps", "**", "*.ts")],
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
    capabilities: [
        {
            platformName: "iOS",
            "wdio:maxInstances": 1,
            "appium:deviceName": process.env.IOS_DEVICE_NAME || "iPhone 16 Pro",
            "appium:platformVersion": process.env.IOS_PLATFORM_VERSION || "18.2",
            "appium:orientation": "PORTRAIT",
            "appium:automationName": "XCUITest",
            "appium:app": join(process.cwd(), "apps", "wdiodemoapp.app"),
            "appium:bundleId": "org.wdiodemoapp",
            "appium:newCommandTimeout": 240,
            "appium:webviewConnectTimeout": 20 * 1000,
            "appium:additionalWebviewBundleIds": ["*"],
            "appium:maxTypingFrequency": 30,
        },
    ],
};
