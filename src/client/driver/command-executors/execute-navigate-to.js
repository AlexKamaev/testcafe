import { navigateTo, Promise } from '../deps/hammerhead';
import { RequestBarrier, pageUnloadBarrier } from '../deps/testcafe-core';

import DriverStatus from '../status';


export default async function executeNavigateTo (command) {
    try {
        const requestBarrier = new RequestBarrier();

        navigateTo(command.url, command.forceReload);

        await Promise.all([requestBarrier.wait(), pageUnloadBarrier.wait()]);

        return new DriverStatus({ windowId: this.windowId,  windowId: this.windowId, isCommandResult: true });
    }
    catch (error) {
        return new DriverStatus({ windowId: this.windowId,  windowId: this.windowId, isCommandResult: true, executionError: error });
    }
}
