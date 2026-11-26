export interface AppConfig {
    androidPackage: string;
    iosBundleId: string;
    iosWebviewBundleIds: string[];
    deepLinkScheme: string;
    webviewUrl: string;
    webviewTitlePattern: RegExp;
}

export const APP_CONFIG: AppConfig = {
    androidPackage: process.env.APP_ANDROID_PACKAGE || 'com.wdiodemoapp',
    iosBundleId: process.env.APP_IOS_BUNDLE_ID || 'org.wdiodemoapp',
    iosWebviewBundleIds: (
        process.env.APP_IOS_WEBVIEW_BUNDLE_IDS || 'org.wdiodemoapp,process-wdiodemoapp'
    )
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean),
    deepLinkScheme: process.env.APP_DEEP_LINK_SCHEME || 'wdio://',
    webviewUrl: process.env.APP_WEBVIEW_URL || 'https://webdriver.io/',
    webviewTitlePattern: new RegExp(process.env.APP_WEBVIEW_TITLE_PATTERN || 'WebdriverIO.*'),
};
