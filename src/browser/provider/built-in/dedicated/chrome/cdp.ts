import path from 'path';
import os from 'os';
import remoteChrome from 'chrome-remote-interface';
import { GET_WINDOW_DIMENSIONS_INFO_SCRIPT } from '../../../utils/client-functions';
import { CdpPool } from './cdp-pool';

interface Size {
    width: number;
    height: number;
}

interface Config {
    deviceName?: string;
    headless: boolean;
    mobile: boolean;
    emulation: false;
    userAgent?: string;
    touch?: boolean;
    width: number;
    height: number;
    scaleFactor: number;
}

interface ProviderMethods {
    resizeLocalBrowserWindow (browserId: string, newWidth: number, newHeight: number, currentWidth: number, currentHeight: number): Promise<void>;
}

export interface RuntimeInfo {
    activeWindowId: string;
    browserId: string;
    cdpPort: number;
    cdpPool: CdpPool;
    tab: remoteChrome.TargetInfo;
    config: Config;
    viewportSize: Size;
    emulatedDevicePixelRatio: number;
    originalDevicePixelRatio: number;
    providerMethods: ProviderMethods;
}

interface TouchConfigOptions {
    enabled: boolean;
    configuration: 'desktop' | 'mobile';
    maxTouchPoints: number;
}

const DOWNLOADS_DIR = path.join(os.homedir(), 'Downloads');

async function setEmulationBounds ({ cdpPool, config, viewportSize, emulatedDevicePixelRatio }: RuntimeInfo): Promise<void> {
    await setDeviceMetricsOverride(cdpPool, viewportSize.width, viewportSize.height, emulatedDevicePixelRatio, config.mobile);

    await cdpPool.setVisibleSize({ width: viewportSize.width, height: viewportSize.height });
}

async function setEmulation (runtimeInfo: RuntimeInfo): Promise<void> {
    const { cdpPool, config } = runtimeInfo;

    if (config.userAgent !== void 0)
        await cdpPool.setUserAgentOverride({ userAgent: config.userAgent });

    if (config.touch !== void 0) {
        const touchConfig: TouchConfigOptions = {
            enabled:        config.touch,
            configuration:  config.mobile ? 'mobile' : 'desktop',
            maxTouchPoints: 1
        };

        await cdpPool.setEmitTouchEventsForMouse(touchConfig);
        await cdpPool.setTouchEmulationEnabled(touchConfig);

        await resizeWindow({ width: config.width, height: config.height }, runtimeInfo);
    }
}

async function enableDownloads ({ cdpPool }: RuntimeInfo): Promise<void> {
    await cdpPool.setDownloadBehavior(DOWNLOADS_DIR);
}

export async function getScreenshotData ({ cdpPool, config, emulatedDevicePixelRatio }: RuntimeInfo, fullPage?: boolean): Promise<Buffer> {
    let viewportWidth  = 0;
    let viewportHeight = 0;

    if (fullPage) {
        const { contentSize, visualViewport } = await cdpPool.getLayoutMetrics();

        await setDeviceMetricsOverride(
            cdpPool,
            Math.ceil(contentSize.width),
            Math.ceil(contentSize.height),
            emulatedDevicePixelRatio,
            config.mobile);

        viewportWidth = visualViewport.clientWidth;
        viewportHeight = visualViewport.clientHeight;
    }

    const screenshotData = await cdpPool.captureScreenshot();

    if (fullPage) {
        if (config.emulation) {
            await setDeviceMetricsOverride(
                cdpPool,
                config.width || viewportWidth,
                config.height || viewportHeight,
                emulatedDevicePixelRatio,
                config.mobile);
        }
        else
            await cdpPool.clearDeviceMetricsOverride();
    }

    return Buffer.from(screenshotData.data, 'base64');
}

async function setDeviceMetricsOverride (cdpPool: CdpPool, width: number, height: number, deviceScaleFactor: number, mobile: boolean): Promise<void> {
    await cdpPool.setDeviceMetricsOverride(width, height, deviceScaleFactor, mobile);
}

export async function createClient (runtimeInfo: RuntimeInfo): Promise<void> {
    const { config } = runtimeInfo;

    const cdpPool = new CdpPool(runtimeInfo);

    try {
        await cdpPool.init();

        if (!cdpPool.parentTarget)
            return;
    }
    catch (e) {
        return;
    }

    runtimeInfo.cdpPool = cdpPool;

    const devicePixelRatioQueryResult = await runtimeInfo.cdpPool.evaluateRuntime('window.devicePixelRatio');

    runtimeInfo.originalDevicePixelRatio = devicePixelRatioQueryResult.result.value;
    runtimeInfo.emulatedDevicePixelRatio = config.scaleFactor || runtimeInfo.originalDevicePixelRatio;

    if (config.emulation)
        await setEmulation(runtimeInfo);

    if (config.headless)
        await enableDownloads(runtimeInfo);
}

export function isHeadlessTab ({ cdpPool, config }: RuntimeInfo): boolean {
    return !!cdpPool.parentTarget && config.headless;
}

export async function closeTab ({ cdpPool, cdpPort }: RuntimeInfo): Promise<void> {
    if (cdpPool.parentTarget)
        await remoteChrome.closeTab({ id: cdpPool.parentTarget.id, port: cdpPort });
}

export async function updateMobileViewportSize (runtimeInfo: RuntimeInfo): Promise<void> {
    const windowDimensionsQueryResult = await runtimeInfo.cdpPool.evaluateRuntime(`(${GET_WINDOW_DIMENSIONS_INFO_SCRIPT})()`, true);

    const windowDimensions = windowDimensionsQueryResult.result.value;

    runtimeInfo.viewportSize.width = windowDimensions.outerWidth;
    runtimeInfo.viewportSize.height = windowDimensions.outerHeight;
}

export async function resizeWindow (newDimensions: Size, runtimeInfo: RuntimeInfo): Promise<void> {
    const { browserId, config, viewportSize, providerMethods } = runtimeInfo;

    const currentWidth = viewportSize.width;
    const currentHeight = viewportSize.height;
    const newWidth = newDimensions.width || currentWidth;
    const newHeight = newDimensions.height || currentHeight;

    if (!config.headless)
        await providerMethods.resizeLocalBrowserWindow(browserId, newWidth, newHeight, currentWidth, currentHeight);

    viewportSize.width = newWidth;
    viewportSize.height = newHeight;

    if (config.emulation)
        await setEmulationBounds(runtimeInfo);
}
