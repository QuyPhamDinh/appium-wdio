import type { RectReturn } from '@wdio/protocols';

let CAROUSEL_RECTANGLES: RectReturn;

class Carousel {
    get carousel() {
        return $(this.locatorStrategy('Carousel'));
    }
    get openSourceCard() {
        return $(this.locatorStrategy('__CAROUSEL_ITEM_0__'));
    }
    get communityCard() {
        return $(this.locatorStrategy('__CAROUSEL_ITEM_1__'));
    }
    get jsFoundationCard() {
        return $(this.locatorStrategy('__CAROUSEL_ITEM_2__'));
    }
    get supportVideosCard() {
        return $(this.locatorStrategy('__CAROUSEL_ITEM_3__'));
    }
    get extendableCard() {
        return $(this.locatorStrategy('__CAROUSEL_ITEM_4__'));
    }
    get compatibleCard() {
        return $(this.locatorStrategy('__CAROUSEL_ITEM_5__'));
    }

    private locatorStrategy(selector: string): string {
        return driver.isIOS
            ? `~${selector}`
            : `//*[@resource-id="${selector}"]`;
    }

    /**
     * Wait for the carousel to be (un)visible
     *
     * @param {boolean} isShown
     */
    async waitForIsDisplayed(isShown = true) {
        await this.carousel.waitForDisplayed({
            reverse: !isShown,
        });
    }

    /**
     * There are 6 cards in the carousel, but only 1 is fully, and 1 is partially visible.
     * We can validate which card is active by checking if it is fully visible.
     * This can be done by checking if the card has position x=0.
     */
    async isCardActive(card: ChainablePromiseElement, expectedWidth?: number) {
        const cardRectangles = await driver.getElementRect(await card.elementId);

        return cardRectangles.x === 0 &&
            (expectedWidth === undefined || Math.abs(cardRectangles.width - expectedWidth) <= 1);
    }

    async waitForCardActive(card: ChainablePromiseElement, expectedWidth?: number) {
        const selector = await card.selector;
        await driver.waitUntil(async () => {
            const currentCard = $(selector);
            return await currentCard.isExisting() && await this.isCardActive(currentCard, expectedWidth);
        }, {
            timeout: 5000,
            timeoutMsg: `Carousel card ${selector} did not become active`,
        });
    }

    /**
     * Get the carousel position and size
     */
    async getCarouselRectangles(): Promise<RectReturn> {
        // Get the rectangles of the carousel and store it in a global that will be used for a next call.
        // We don't want ask for the rectangles of the carousel if we already know them.
        // This will save unneeded webdriver calls.
        CAROUSEL_RECTANGLES =
            CAROUSEL_RECTANGLES ||
            (await driver.getElementRect(await this.carousel.elementId));

        return CAROUSEL_RECTANGLES;
    }

    async swipeToCard(direction: 'left' | 'right', activeCard: ChainablePromiseElement, targetCard: ChainablePromiseElement) {
        const activeBounds = driver.isAndroid ? await driver.getElementRect(await activeCard.elementId) : undefined;
        await this.swipe(direction, activeBounds);
        try {
            await this.waitForCardActive(targetCard, activeBounds?.width);
            return;
        } catch (error) {
            const targetSelector = await targetCard.selector;
            if (!activeBounds || !(error instanceof Error) ||
                error.message !== `Carousel card ${targetSelector} did not become active`) {
                throw error;
            }

            const activeSelector = await activeCard.selector;
            let stableSamples = 0;
            await driver.waitUntil(async () => {
                const previousCard = $(activeSelector);
                const stillActive = await previousCard.isExisting() && await this.isCardActive(previousCard, activeBounds.width);
                stableSamples = stillActive ? stableSamples + 1 : 0;
                return stableSamples === 2;
            }, {
                interval: 300,
                timeout: 1000,
                timeoutMsg: `Could not safely retry swipe to ${targetSelector} because the previous card moved`,
            });
            console.warn(`Retrying swipe to ${targetSelector} after the previous card stayed active`);
            await this.swipe(direction, activeBounds);
            await this.waitForCardActive(targetCard, activeBounds.width);
        }
    }

    private async swipe(direction: 'left' | 'right', activeBounds?: RectReturn) {
        if (activeBounds) {
            const { x, y, width, height } = activeBounds;
            // UiAutomator2 starts the swipe at the edge of its gesture area.
            const inset = Math.round(width * 0.1);
            await driver.execute('mobile: swipeGesture', {
                left: x + inset,
                top: y,
                width: width - 2 * inset,
                height,
                direction,
                percent: 1,
                speed: Math.round(width * 2),
            });
            return;
        }

        await driver.swipe({
            direction,
            scrollableElement: this.carousel,
            percent: 0.8,
        });
    }
}

export default new Carousel();
