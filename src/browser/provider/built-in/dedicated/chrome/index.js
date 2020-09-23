import OS from 'os-family';
import { parse as parseUrl } from 'url';
import dedicatedProviderBase from '../base';
import ChromeRunTimeInfo from './runtime-info';
import getConfig from './config';
import { start as startLocalChrome, stop as stopLocalChrome } from './local-chrome';
import * as cdp from './cdp';
import { GET_WINDOW_DIMENSIONS_INFO_SCRIPT } from '../../../utils/client-functions';

const MIN_AVAILABLE_DIMENSION = 50;

export default {
    ...dedicatedProviderBase,

    _getConfig (name) {
        return getConfig(name);
    },

    _getBrowserProtocolClient (runtimeInfo) {
        return runtimeInfo.cdpPool;
    },

    async _createRunTimeInfo (hostName, configString, disableMultipleWindows) {
        return ChromeRunTimeInfo.create(hostName, configString, disableMultipleWindows);
    },

    _setUserAgentMetaInfoForEmulatingDevice (browserId, config) {
        const { emulation, deviceName } = config;
        const isDeviceEmulation         = emulation && deviceName;

        if (!isDeviceEmulation)
            return;

        const metaInfo = `Emulating ${deviceName}`;
        const options  = {
            appendToUserAgent: true
        };

        this.setUserAgentMetaInfo(browserId, metaInfo, options);
    },

    async openBrowser (browserId, pageUrl, configString, disableMultipleWindows) {
        const parsedPageUrl = parseUrl(pageUrl);
        const runtimeInfo   = await this._createRunTimeInfo(parsedPageUrl.hostname, configString, disableMultipleWindows);

        runtimeInfo.browserName = this._getBrowserName();
        runtimeInfo.browserId   = browserId;

        runtimeInfo.providerMethods = {
            resizeLocalBrowserWindow: (...args) => this.resizeLocalBrowserWindow(...args)
        };

        await startLocalChrome(pageUrl, runtimeInfo);

        await this.waitForConnectionReady(browserId);

        runtimeInfo.viewportSize   = await this.runInitScript(browserId, GET_WINDOW_DIMENSIONS_INFO_SCRIPT);
        runtimeInfo.activeWindowId = null;

        if (!disableMultipleWindows)
            runtimeInfo.activeWindowId = this.calculateWindowId();

        await cdp.createClient(runtimeInfo);

        this.openedBrowsers[browserId] = runtimeInfo;

        await this._ensureWindowIsExpanded(browserId, runtimeInfo.viewportSize);

        this._setUserAgentMetaInfoForEmulatingDevice(browserId, runtimeInfo.config);
    },

    async closeBrowser (browserId) {
        const runtimeInfo = this.openedBrowsers[browserId];

        if (runtimeInfo.cdpPool.isHeadlessTab())
            await runtimeInfo.cdpPool.closeTab();
        else
            await this.closeLocalBrowser(browserId);

        if (OS.mac || runtimeInfo.config.headless)
            await stopLocalChrome(runtimeInfo);

        if (runtimeInfo.tempProfileDir)
            await runtimeInfo.tempProfileDir.dispose();

        delete this.openedBrowsers[browserId];
    },

    async resizeWindow (browserId, width, height, currentWidth, currentHeight) {
        const runtimeInfo = this.openedBrowsers[browserId];

        if (runtimeInfo.config.mobile)
            await runtimeInfo.cdpPool.updateMobileViewportSize();
        else {
            runtimeInfo.viewportSize.width  = currentWidth;
            runtimeInfo.viewportSize.height = currentHeight;
        }

        await runtimeInfo.cdpPool.resizeWindow({ width, height }, runtimeInfo);
    },

    async getVideoFrameData (browserId) {
        const { cdpPool } = this.openedBrowsers[browserId];

        return cdpPool.getScreenshotData();
    },

    async hasCustomActionForBrowser (browserId) {
        const { config, cdpPool } = this.openedBrowsers[browserId];

        debugger;

        const client              = await cdpPool.getActiveClient();

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
            const newHeight = Math.max(availableHeight, MIN_AVAILABLE_DIMENSION);
            const newWidth  = Math.max(Math.floor(availableWidth / 2), MIN_AVAILABLE_DIMENSION);

            await this.resizeWindow(browserId, newWidth, newHeight, outerWidth, outerHeight);
        }
    }
};
