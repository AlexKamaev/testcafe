import remoteChrome from 'chrome-remote-interface';
import { Dictionary } from '../../../../../configuration/interfaces';
import Protocol from 'devtools-protocol';
import { RuntimeInfo } from './cdp';

export class CdpPool {
    private _clients: Dictionary<remoteChrome.ProtocolApi> = {};
    private _runtimeInfo: RuntimeInfo;

    public parentTarget?: remoteChrome.TargetInfo;

    public constructor (runtimeInfo: RuntimeInfo) {
        this._runtimeInfo = runtimeInfo;
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

        await this._createClient();

        await this._enable();
    }

    private async _createClient (): Promise<remoteChrome.ProtocolApi> {
        const target = await this._getActiveTab();
        const client = await remoteChrome({ target, port: this._runtimeInfo.cdpPort });

        this._clients[this._clientKey] = client;

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
