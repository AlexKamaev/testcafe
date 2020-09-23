import remoteChrome from 'chrome-remote-interface';
import { Dictionary } from '../../../../../configuration/interfaces';
import Protocol from 'devtools-protocol';
import { RuntimeInfo } from './cdp';
import path from 'path';
import os from 'os';
import { GET_WINDOW_DIMENSIONS_INFO_SCRIPT } from '../../../utils/client-functions';

interface Size {
    width: number;
    height: number;
}

const DOWNLOADS_DIR = path.join(os.homedir(), 'Downloads');

export class CdpPool {
    private _clients: Dictionary<remoteChrome.ProtocolApi> = {};
    private _runtimeInfo: RuntimeInfo;

    public parentTarget?: remoteChrome.TargetInfo;

    public constructor (runtimeInfo: RuntimeInfo) {
        this._runtimeInfo = runtimeInfo;

        runtimeInfo.cdpPool = this;
    }

    private get _clientKey (): string {
        return this._runtimeInfo.activeWindowId || this._runtimeInfo.browserId;
    }

    private async _getTabs (): Promise<remoteChrome.TargetInfo[]> {
        const tabs = await remoteChrome.listTabs({ port: this._runtimeInfo.cdpPort });

        return tabs.filter(t => t.type === 'page');
    }

    private async _getActiveTab (): Promise<remoteChrome.TargetInfo> {
        let tabs = await this._getTabs();

        if (this._runtimeInfo.activeWindowId)
            tabs = tabs.filter(t => t.title.includes(this._runtimeInfo.activeWindowId));

        return tabs[0];
    }

    public async init (): Promise<void> {
        const tabs = await this._getTabs();

        this.parentTarget = tabs.find(t => t.url.includes(this._runtimeInfo.browserId));

        await this._createClient(true);

        const devicePixelRatioQueryResult = await this.evaluateRuntime('window.devicePixelRatio');

        this._runtimeInfo.originalDevicePixelRatio = devicePixelRatioQueryResult.result.value;
        this._runtimeInfo.emulatedDevicePixelRatio = this._runtimeInfo.config.scaleFactor || this._runtimeInfo.originalDevicePixelRatio;

        if (this._runtimeInfo.config.emulation)
            await this.setEmulation();

        if (this._runtimeInfo.config.headless)
            await this.enableDownloads();
    }

    private async _createClient (first: boolean = false): Promise<remoteChrome.ProtocolApi> {
        const target = await this._getActiveTab();
        const client = await remoteChrome({ target, port: this._runtimeInfo.cdpPort });

        this._clients[this._clientKey] = client;

        await this._enable();

        if (!first) {
            if (this._runtimeInfo.config.emulation)
                await this.setEmulation();

            if (this._runtimeInfo.config.headless)
                await this.enableDownloads();
        }

        return client;
    }


    public async getActiveClient (): Promise<remoteChrome.ProtocolApi> {
        const client = this._clients[this._clientKey];

        if (client)
            return client;

        return this._createClient();
    }

    public async setVisibleSize (viewportSize: any): Promise<void> {
        const { Emulation } = await this.getActiveClient();

        await Emulation.setVisibleSize({ width: viewportSize.width, height: viewportSize.height });
    }

    public async setUserAgentOverride (config: any): Promise<void> {
        const { Network } = await this.getActiveClient();

        await Network.setUserAgentOverride({ userAgent: config.userAgent });
    }

    public async setEmitTouchEventsForMouse (touchConfig: any): Promise<void> {
        const { Emulation } = await this.getActiveClient();

        if (Emulation.setEmitTouchEventsForMouse)
            await Emulation.setEmitTouchEventsForMouse(touchConfig);
    }

    public async setTouchEmulationEnabled (touchConfig: any): Promise<void> {
        const { Emulation } = await this.getActiveClient();

        if (Emulation.setTouchEmulationEnabled)
            await Emulation.setTouchEmulationEnabled(touchConfig);
    }

    public async setDownloadBehavior (downloadPath: string): Promise<void> {
        const { Page } = await this.getActiveClient();

        await Page.setDownloadBehavior({
            behavior: 'allow',
            downloadPath
        });
    }

    public async getLayoutMetrics (): Promise<Protocol.Page.GetLayoutMetricsResponse> {
        const { Page } = await this.getActiveClient();

        return Page.getLayoutMetrics();
    }

    public async captureScreenshot (): Promise<Protocol.Page.CaptureScreenshotResponse> {
        const { Page } = await this.getActiveClient();

        return Page.captureScreenshot({});
    }

    public async setDeviceMetricsOverride (width: number, height: number, deviceScaleFactor: number, mobile: boolean): Promise<void> {
        const { Emulation } = await this.getActiveClient();

        await Emulation.setDeviceMetricsOverride({
            width,
            height,
            deviceScaleFactor,
            mobile,
            // @ts-ignore
            fitWindow: false
        });
    }

    public async clearDeviceMetricsOverride (): Promise<void> {
        const { Emulation } = await this.getActiveClient();

        await Emulation.clearDeviceMetricsOverride();
    }

    public async getScreenshotData (fullPage?: boolean): Promise<Buffer> {
        let viewportWidth  = 0;
        let viewportHeight = 0;

        const { config, emulatedDevicePixelRatio } = this._runtimeInfo;

        if (fullPage) {
            const { contentSize, visualViewport } = await this.getLayoutMetrics();

            await this.setDeviceMetricsOverride(
                Math.ceil(contentSize.width),
                Math.ceil(contentSize.height),
                emulatedDevicePixelRatio,
                config.mobile);

            viewportWidth = visualViewport.clientWidth;
            viewportHeight = visualViewport.clientHeight;
        }

        const screenshotData = await this.captureScreenshot();

        if (fullPage) {
            if (config.emulation) {
                await this.setDeviceMetricsOverride(
                    config.width || viewportWidth,
                    config.height || viewportHeight,
                    emulatedDevicePixelRatio,
                    config.mobile);
            }
            else
                await this.clearDeviceMetricsOverride();
        }

        return Buffer.from(screenshotData.data, 'base64');
    }

    public isHeadlessTab (): boolean {
        return !!this.parentTarget && this._runtimeInfo.config.headless;
    }

    public async closeTab (): Promise<void> {
        if (this.parentTarget)
            await remoteChrome.closeTab({ id: this.parentTarget.id, port: this._runtimeInfo.cdpPort });
    }

    public async updateMobileViewportSize (): Promise<void> {
        const windowDimensionsQueryResult = await this.evaluateRuntime(`(${GET_WINDOW_DIMENSIONS_INFO_SCRIPT})()`, true);

        const windowDimensions = windowDimensionsQueryResult.result.value;

        this._runtimeInfo.viewportSize.width = windowDimensions.outerWidth;
        this._runtimeInfo.viewportSize.height = windowDimensions.outerHeight;
    }

    public async setEmulation (): Promise<void> {
        debugger;

        const { config } = this._runtimeInfo;

        if (config.userAgent !== void 0)
            await this.setUserAgentOverride({ userAgent: config.userAgent });

        if (config.touch !== void 0) {
            const touchConfig: any = {
                enabled:        config.touch,
                configuration:  config.mobile ? 'mobile' : 'desktop',
                maxTouchPoints: 1
            };

            await this.setEmitTouchEventsForMouse(touchConfig);
            await this.setTouchEmulationEnabled(touchConfig);

            await this.resizeWindow({ width: config.width, height: config.height });
        }
    }

    public async resizeWindow (newDimensions: Size): Promise<void> {
        const { browserId, config, viewportSize, providerMethods, emulatedDevicePixelRatio } = this._runtimeInfo;

        const currentWidth = viewportSize.width;
        const currentHeight = viewportSize.height;
        const newWidth = newDimensions.width || currentWidth;
        const newHeight = newDimensions.height || currentHeight;

        if (!config.headless)
            await providerMethods.resizeLocalBrowserWindow(browserId, newWidth, newHeight, currentWidth, currentHeight);

        viewportSize.width = newWidth;
        viewportSize.height = newHeight;

        if (config.emulation) {
            await this.setDeviceMetricsOverride(viewportSize.width, viewportSize.height, emulatedDevicePixelRatio, config.mobile);
            await this.setVisibleSize({ width: viewportSize.width, height: viewportSize.height });
        }
    }

    private async enableDownloads (): Promise<void> {
        await this.setDownloadBehavior(DOWNLOADS_DIR);
    }

    private async _enable (): Promise<void> {
        const { Page, Network, Runtime } = await this.getActiveClient();

        await Page.enable();
        await Network.enable({});
        await Runtime.enable();
    }

    public async evaluateRuntime (expression: string, returnByValue: boolean = false): Promise<Protocol.Runtime.EvaluateResponse> {
        const { Runtime } = await this.getActiveClient();

        return Runtime.evaluate({ expression, returnByValue });
    }
}
