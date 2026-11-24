import TabBar from '../screenobjects/components/TabBar.js';
import SwipeScreen from '../screenobjects/SwipeScreen.js';
import Carousel from '../screenobjects/components/Carousel.js';

describe('WebdriverIO and Appium, when using swiping', () => {
    beforeEach(async () => {
        await TabBar.waitForTabBarShown();
        await TabBar.openSwipe();
        await SwipeScreen.waitForIsShown(true);
    });

    it('should be able to swipe horizontal by swiping the carousel from left to right', async () => {
        const cards = [
            'openSourceCard',
            'communityCard',
            'jsFoundationCard',
            'supportVideosCard',
            'extendableCard',
            'compatibleCard',
        ] as const;

        await Carousel.waitForCardActive(Carousel[cards[0]]);
        for (let index = 1; index < cards.length; index++) {
            await Carousel.swipeToCard('left', Carousel[cards[index - 1]], Carousel[cards[index]]);
        }

        for (let index = cards.length - 2; index >= 0; index--) {
            await Carousel.swipeToCard('right', Carousel[cards[index + 1]], Carousel[cards[index]]);
        }
    });

    it('should be able to swipe vertical by finding the surprise', async () => {
        // Finding the logo will be done with the "new" `scrollIntoView` method which now supports native apps as well
        await SwipeScreen.logo.scrollIntoView({
            scrollableElement: await SwipeScreen.screen,
            direction: 'up',
            maxScrolls: 5,
            percent: 0.99,
        });
        await expect(SwipeScreen.logo).toBeDisplayed();
    });

    // You will find a native swipe example below, but it is commented out because even though it looks "simple",
    // there are more details you need to know about:
    // - the device/OS
    // - what is the difference between the native swipe on iOS and Android
    // Our advice is to use the methods as described above, but if you want to use the native swipe, please check the official driver docs
    //
    // it('should be able to swipe the native way', async () => {
    //     /**
    //      * To understand what happens in `isCardActive()` please check the method
    //      */
    //     await expect(await Carousel.isCardActive(await Carousel.openSourceCard)).toBeTruthy();
    //     if (driver.isAndroid){
    //         // Src: https://github.com/appium/appium-uiautomator2-driver/blob/master/docs/android-mobile-gestures.md#mobile-swipegesture
    //         await driver.execute('mobile: swipeGesture', {
    //             direction: DIRECTIONS.LEFT,
    //             // The elementId is not mandatory, you can also swipe based on top, right, bottom, left coordinates.
    //             // Using coordinates will make it a little bit more complex because you need to calculate the coordinates of the element
    //             // you want to use to swipe withing.
    //             // On the other hand, using the elementId will make it easier to swipe, but you need to make sure that the device
    //             // you are using does not have left or right actions on for example the edge of the screen which would trigger those actions.
    //             elementId: (await Carousel.carousel).elementId,
    //             percent: 0.5,
    //             // Speeds it optional, but if you want to use it, you need to multiply the speed with the displayDensity of the device.
    //             // speed: {number} * displayDensity
    //         });
    //     } else {
    //         // Src: https://appium.github.io/appium-xcuitest-driver/5.12/execute-methods/#mobile-swipe
    //         await driver.execute('mobile: swipe', {
    //             direction: DIRECTIONS.LEFT,
    //             elementId: (await Carousel.carousel).elementId,
    //             // The velocity is not mandatory, it is measured in pixels per second and same values could behave differently
    //             //  on different devices depending on their display density.
    //             velocity: 250,
    //         });
    //     }

    //     // For demo purposes
    //     await driver.pause(3000);

    // });
});
