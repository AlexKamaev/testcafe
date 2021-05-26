import CommandBase from './base';

declare class ExecuteClientFunctionCommandBase {
    public instantiationCallsiteName: string;
    public fnCode: string;
    public args: string[];
    public dependencies: string[];
}

export class ExecuteClientFunctionCommand extends ExecuteClientFunctionCommandBase {}

export class ExecuteSelectorCommand extends ExecuteClientFunctionCommandBase {
    public visibilityCheck: boolean;
    public timeout: number;
    public apiFnChain: string[];
    public needError: boolean;
    public index: number;
}

export class DebugCommand extends CommandBase {
    public type: string;
}

export class DisableDebugCommand extends CommandBase {
    public type: string;
}
