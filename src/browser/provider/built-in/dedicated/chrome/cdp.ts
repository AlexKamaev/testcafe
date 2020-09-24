import remoteChrome from 'chrome-remote-interface';
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

// export async function getScreenshotData ({ cdpPool }: RuntimeInfo, fullPage?: boolean): Promise<Buffer> {
//     return cdpPool.getScreenshotData(fullPage);
// }

// export async function createClient (runtimeInfo: RuntimeInfo): Promise<void> {
//     const cdpPool = new CdpPool(runtimeInfo);
//
//     try {
//         await cdpPool.init();
//
//         if (!cdpPool.parentTarget)
//             return;
//     }
//     catch (e) {
//         return;
//     }
// }

// export function isHeadlessTab ({ cdpPool, config }: RuntimeInfo): boolean {
//     return !!cdpPool.parentTarget && config.headless;
// }
//
// export async function closeTab ({ cdpPool, cdpPort }: RuntimeInfo): Promise<void> {
//     if (cdpPool.parentTarget)
//         await remoteChrome.closeTab({ id: cdpPool.parentTarget.id, port: cdpPort });
// }

// export async function updateMobileViewportSize (runtimeInfo: RuntimeInfo): Promise<void> {
//     const windowDimensionsQueryResult = await runtimeInfo.cdpPool.evaluateRuntime(`(${GET_WINDOW_DIMENSIONS_INFO_SCRIPT})()`, true);
//
//     const windowDimensions = windowDimensionsQueryResult.result.value;
//
//     runtimeInfo.viewportSize.width = windowDimensions.outerWidth;
//     runtimeInfo.viewportSize.height = windowDimensions.outerHeight;
// }

// export async function resizeWindow (newDimensions: Size, runtimeInfo: RuntimeInfo): Promise<void> {
//     const { browserId, config, viewportSize, providerMethods, cdpPool, emulatedDevicePixelRatio } = runtimeInfo;
//
//     const currentWidth = viewportSize.width;
//     const currentHeight = viewportSize.height;
//     const newWidth = newDimensions.width || currentWidth;
//     const newHeight = newDimensions.height || currentHeight;
//
//     if (!config.headless)
//         await providerMethods.resizeLocalBrowserWindow(browserId, newWidth, newHeight, currentWidth, currentHeight);
//
//     viewportSize.width = newWidth;
//     viewportSize.height = newHeight;
//
//     if (config.emulation) {
//         await cdpPool.setDeviceMetricsOverride(viewportSize.width, viewportSize.height, emulatedDevicePixelRatio, config.mobile);
//         await cdpPool.setVisibleSize({ width: viewportSize.width, height: viewportSize.height });
//     }
// }
