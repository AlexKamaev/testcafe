import OS from 'os-family';
import { parse as parseUrl } from 'url';
import getRuntimeInfo from './runtime-info';
import { start as startLocalChrome, stop as stopLocalChrome } from './local-chrome';
import * as cdp from './cdp';
import getMaximizedHeadlessWindowSize from '../../utils/get-maximized-headless-window-size';
import { GET_WINDOW_DIMENSIONS_INFO_SCRIPT } from '../../utils/client-functions';
import { cropScreenshotBinary } from '../../../../screenshots/crop';
import { readPng, writePng } from '../../../../utils/png';

import { PNG } from 'pngjs';

const MIN_AVAILABLE_DIMENSION = 50;

export default {
    openedBrowsers: {},

    isMultiBrowser: false,

    async openBrowser (browserId, pageUrl, configString) {
        const runtimeInfo = await getRuntimeInfo(parseUrl(pageUrl).hostname, configString);
        const browserName = this.providerName.replace(':', '');

        runtimeInfo.browserId   = browserId;
        runtimeInfo.browserName = browserName;

        runtimeInfo.providerMethods = {
            resizeLocalBrowserWindow: (...args) => this.resizeLocalBrowserWindow(...args)
        };

        await startLocalChrome(pageUrl, runtimeInfo);

        await this.waitForConnectionReady(browserId);

        runtimeInfo.viewportSize = await this.runInitScript(browserId, GET_WINDOW_DIMENSIONS_INFO_SCRIPT);

        await cdp.createClient(runtimeInfo);

        this.openedBrowsers[browserId] = runtimeInfo;

        await this._ensureWindowIsExpanded(browserId, runtimeInfo.viewportSize);
    },

    async closeBrowser (browserId) {
        const runtimeInfo = this.openedBrowsers[browserId];

        if (cdp.isHeadlessTab(runtimeInfo))
            await cdp.closeTab(runtimeInfo);
        else
            await this.closeLocalBrowser(browserId);

        if (OS.mac || runtimeInfo.config.headless)
            await stopLocalChrome(runtimeInfo);

        if (runtimeInfo.tempProfileDir)
            await runtimeInfo.tempProfileDir.dispose();

        delete this.openedBrowsers[browserId];
    },

    async isLocalBrowser () {
        return true;
    },

    isHeadlessBrowser (browserId) {
        return this.openedBrowsers[browserId].config.headless;
    },

    async takeScreenshot (browserId, path) {
        const runtimeInfo = this.openedBrowsers[browserId];
        const viewport    = await cdp.getPageViewport(runtimeInfo);
        const binaryImage = await cdp.getScreenshotData(runtimeInfo);

        const { clientWidth, clientHeight } = viewport;

        const croppedImage = await cropScreenshotBinary(path, false, null, {
            right:  clientWidth,
            left:   0,
            top:    0,
            bottom: clientHeight
        }, binaryImage);

        if (croppedImage)
            await writePng(path, croppedImage);
    },

    async resizeWindow (browserId, width, height, currentWidth, currentHeight) {
        const runtimeInfo = this.openedBrowsers[browserId];

        if (runtimeInfo.config.mobile)
            await cdp.updateMobileViewportSize(runtimeInfo);
        else {
            runtimeInfo.viewportSize.width  = currentWidth;
            runtimeInfo.viewportSize.height = currentHeight;
        }

        await cdp.resizeWindow({ width, height }, runtimeInfo);
    },

    async maximizeWindow (browserId) {
        const maximumSize = getMaximizedHeadlessWindowSize();

        await this.resizeWindow(browserId, maximumSize.width, maximumSize.height, maximumSize.width, maximumSize.height);
    },

    async getVideoFrameData (browserId) {
        const image = await cdp.getScreenshotData(this.openedBrowsers[browserId]);

        // return image;

        const png = await readPng(image);

        console.log(image);

        try {

            console.log(png.width)
            console.log(png.height)
            const pngImage = await cropScreenshotBinary('', false, null, {
                right:  png.width,
                left:   0,
                top:    0,
                bottom: png.height
            }, image);

            if (!pngImage)
                console.log('keke');


            debugger;


            // const binary = PNG.sync.write(pngImage);


            const chunks = [];

            const promise = new Promise(resolve => {
                const keke = pngImage.pack();

                pngImage.on('data', (a, b, c, d) => {
                    // console.log('************');
                    // console.log(a);
                    // console.log('++++++++++');

                    chunks.push(a);
                })

                pngImage.on('end', (a, b, c, d) => {
                    console.log('---end---');

                    const fileBuffer = Buffer.concat(chunks);



                    console.log(fileBuffer);

                    resolve(fileBuffer);
                });
            })
            // const keke = pngImage.pack();
            //
            // pngImage.on('data', (a, b, c, d) => {
            //     // console.log('************');
            //     // console.log(a);
            //     // console.log('++++++++++');
            //
            //     chunks.push(a);
            // })
            //
            // pngImage.on('end', (a, b, c, d) => {
            //    console.log('---end---');
            //
            //     const fileBuffer = Buffer.concat(chunks);
            //
            //     console.log(fileBuffer);
            // });

            return await promise;

            // return binary;
            //
            // console.log(pngImage.data);
            //
            // return pngImage ? pngImage.data : null;
        } catch (err) {
            console.log(err);
        }

    },

    async hasCustomActionForBrowser (browserId) {
        const { config, client } = this.openedBrowsers[browserId];

        return {
            hasCloseBrowser:                true,
            hasResizeWindow:                !!client && (config.emulation || config.headless),
            hasMaximizeWindow:              !!client && config.headless,
            hasTakeScreenshot:              !!client,
            hasChromelessScreenshots:       !!client,
            hasGetVideoFrameData:           !!client,
            hasCanResizeWindowToDimensions: false
        };
    },

    async _ensureWindowIsExpanded (browserId, { height, width, availableHeight, availableWidth, outerWidth, outerHeight }) {
        if (height < MIN_AVAILABLE_DIMENSION || width < MIN_AVAILABLE_DIMENSION) {
            const newHeight = availableHeight;
            const newWidth  = Math.floor(availableWidth / 2);

            await this.resizeWindow(browserId, newWidth, newHeight, outerWidth, outerHeight);
        }
    }
};
