import { spawn, ChildProcess } from 'child_process';
import cdp from 'chrome-remote-interface';

import {
    HOST_INPUT_FD,
    HOST_OUTPUT_FD,
    HOST_SYNC_FD
} from './io';

import path from 'path';
import url from 'url';

import { restore as restoreTestStructure } from '../serialization/test-structure';
import prepareOptions from '../serialization/prepare-options';
import { default as testRunTracker } from '../../api/test-run-tracker';
import TestRun from '../../test-run';
import { IPCProxy } from '../utils/ipc/proxy';
import { HostTransport } from '../utils/ipc/transport';
import AsyncEventEmitter from '../../utils/async-event-emitter';
import TestCafeErrorList from '../../errors/error-list';
import DEBUG_ACTION from '../../utils/debug-action';

import {
    CompilerProtocol,
    RunTestArguments,
    ExecuteActionArguments,
    FunctionProperties,
    SetOptionsArguments,
    ExecuteCommandArguments,
    RequestHookEventArguments,
    SetMockArguments,
    SetConfigureResponseEventOptionsArguments,
    SetHeaderOnConfigureResponseEventArguments,
    RemoveHeaderOnConfigureResponseEventArguments,
    ExecuteRequestFilterRulePredicateArguments,
    RequestFilterRuleLocator,
    ExecuteMockPredicate,
    GetWarningMessagesArguments,
    AddRequestEventListenersArguments,
    RemoveRequestEventListenersArguments,
    InitializeTestRunDataArguments
} from './protocol';

import { CompilerArguments } from '../../compiler/interfaces';
import Test from '../../api/structure/test';
import {
    RequestInfo,
    ResponseMock,
    IncomingMessageLikeInitOptions,
    RequestEvent,
    ConfigureResponseEvent,
    ResponseEvent,
    RequestFilterRule
} from 'testcafe-hammerhead';

import { CallsiteRecord } from 'callsite-record';

import { DebugCommand, DisableDebugCommand } from '../../test-run/commands/observation';

const SERVICE_PATH       = require.resolve('./service');
const INTERNAL_FILES_URL = url.pathToFileURL(path.join(__dirname, '../../'));

interface RuntimeResources {
    service: ChildProcess;
    proxy: IPCProxy;
}

interface TestFunction {
    (testRun: TestRun): Promise<unknown>;
}

interface RequestFilterRulePredicate {
    (requestInfo: RequestInfo): Promise<boolean>;
}

interface WrapMockPredicateArguments extends RequestFilterRuleLocator {
    mock: ResponseMock;
}

const BREAK_ON_START = 'Break on start';

export default class CompilerHost extends AsyncEventEmitter implements CompilerProtocol {
    private runtime: Promise<RuntimeResources|undefined>;
    private cdp: any;

    public constructor () {
        super();

        this.runtime = Promise.resolve(void 0);
    }

    private _setupRoutes (proxy: IPCProxy): void {
        proxy.register([
            this.executeAction,
            this.executeCommand,
            this.ready,
            this.onRequestHookEvent,
            this.setMock,
            this.setConfigureResponseEventOptions,
            this.setHeaderOnConfigureResponseEvent,
            this.removeHeaderOnConfigureResponseEvent,
            this.executeRequestFilterRulePredicate,
            this.executeMockPredicate,
            this.getWarningMessages,
            this.addRequestEventListeners,
            this.removeRequestEventListeners,
            this.initializeTestRunData,
            this.enableDebug,
            this.disableDebug
        ], this);
    }

    private _setupDebuggerHandlers (): void {
        testRunTracker.on(DEBUG_ACTION.resume, async () => {
            await this.cdp.Runtime.evaluate({
                expression:            `require.main.require('../../api/test-controller').disableDebug()`,
                includeCommandLineAPI: true
            });

            await this.cdp.Debugger.resume();
        });

        testRunTracker.on(DEBUG_ACTION.step, async () => {
            await this.cdp.Runtime.evaluate({
                expression:            `require.main.require('../../api/test-controller').enableDebug()`,
                includeCommandLineAPI: true
            });

            await this.cdp.Debugger.resume();
        });

        this.cdp.on('Debugger.paused', (args: any): Promise<void> => {
            const { callFrames } = args;

            if (args.reason === BREAK_ON_START)
                return this.cdp.Debugger.resume();

            if (callFrames[0].url.includes(INTERNAL_FILES_URL))
                return this.cdp.Debugger.stepOut();

            Object.values(testRunTracker.activeTestRuns).forEach(testRun => {
                if (!testRun.debugging)
                    testRun.executeCommand(new DebugCommand());
            });

            return Promise.resolve();
        });

        this.cdp.on('Debugger.resumed', () => {
            Object.values(testRunTracker.activeTestRuns).forEach(testRun => {
                if (testRun.debugging)
                    testRun.executeCommand(new DisableDebugCommand());
            });
        });
    }


    private async _init (runtime: Promise<RuntimeResources|undefined>): Promise<RuntimeResources|undefined> {
        const resolvedRuntime = await runtime;

        if (resolvedRuntime)
            return resolvedRuntime;

        try {
            const port    = '64128';
            const service = spawn(process.argv0, [`--inspect-brk=127.0.0.1:${port}`, SERVICE_PATH], { stdio: [0, 1, 2, 'pipe', 'pipe', 'pipe'] });

            // NOTE: need to wait, otherwise the error will be at `await cdp(...)`
            await new Promise(r => setTimeout(r, 2000));

            // @ts-ignore
            this.cdp = await cdp({ port });

            this._setupDebuggerHandlers();

            await this.cdp.Debugger.enable();
            await this.cdp.Runtime.enable();
            await this.cdp.Runtime.runIfWaitingForDebugger();

            // HACK: Node.js definition are not correct when additional I/O channels are sp
            const stdio = service.stdio as any;
            const proxy = new IPCProxy(new HostTransport(stdio[HOST_INPUT_FD], stdio[HOST_OUTPUT_FD], stdio[HOST_SYNC_FD]));

            this._setupRoutes(proxy);

            await this.once('ready');

            return { proxy, service };
        }
        catch (e) {
            return void 0;
        }
    }

    private async _getRuntime (): Promise<RuntimeResources> {
        const runtime = await this.runtime;

        if (!runtime)
            throw new Error('Runtime is not available.');

        return runtime;
    }

    private _prepareEventData (eventData: RequestEvent | ConfigureResponseEvent | ResponseEvent): RequestEvent | ConfigureResponseEvent | ResponseEvent {
        // TODO: Remove eventData._requestContext into 'testcafe-hammerhead' module
        // after switching to the compiler service mode.

        // NOTE: Access to the deprecated property inside of the unserializable 'eventData._requestContext' property
        // causes the node's deprecation warning.

        const clonedEventData = Object.assign({}, eventData);

        // @ts-ignore
        delete clonedEventData._requestContext;

        return clonedEventData;
    }

    public async init (): Promise<void> {
        this.runtime = this._init(this.runtime);

        await this.runtime;
    }

    public async stop (): Promise<void> {
        const { service } = await this._getRuntime();

        service.kill();
    }

    private _wrapTestFunction (id: string, functionName: FunctionProperties): TestFunction {
        return async testRun => {
            try {
                return await this.runTestFn({ id, functionName, testRunId: testRun.id });
            }
            catch (err) {
                const errList = new TestCafeErrorList();

                errList.addError(err);

                throw errList;
            }
        };
    }

    private _wrapRequestFilterRulePredicate ({ testId, hookId, ruleId }: RequestFilterRuleLocator): RequestFilterRulePredicate {
        return async (requestInfo: RequestInfo) => {
            return await this.executeRequestFilterRulePredicate({ testId, hookId, ruleId, requestInfo });
        };
    }

    private _wrapMockPredicate ({ mock, testId, hookId, ruleId }: WrapMockPredicateArguments): void {
        mock.body = async (requestInfo: RequestInfo, res: IncomingMessageLikeInitOptions) => {
            return await this.executeMockPredicate({ testId, hookId, ruleId, requestInfo, res });
        };
    }

    public async ready (): Promise<void> {
        this.emit('ready');
    }

    public async executeAction (data: ExecuteActionArguments): Promise<unknown> {
        const targetTestRun = testRunTracker.activeTestRuns[data.id];

        if (!targetTestRun)
            return void 0;

        return targetTestRun.executeAction(data.apiMethodName, data.command, data.callsite as CallsiteRecord);
    }

    public executeActionSync (): never {
        throw new Error('The method should not be called.');
    }

    public async executeCommand ({ command, id }: ExecuteCommandArguments): Promise<unknown> {
        const targetTestRun = testRunTracker.activeTestRuns[id];

        if (!targetTestRun)
            return void 0;

        return targetTestRun.executeCommand(command);
    }

    public async getTests ({ sourceList, compilerOptions }: CompilerArguments): Promise<Test[]> {
        const { proxy } = await this._getRuntime();

        const units = await proxy.call(this.getTests, { sourceList, compilerOptions });

        return restoreTestStructure(
            units,
            (...args) => this._wrapTestFunction(...args),
            (ruleLocator: RequestFilterRuleLocator) => this._wrapRequestFilterRulePredicate(ruleLocator)
        );
    }

    public async runTestFn ({ id, functionName, testRunId }: RunTestArguments): Promise<unknown> {
        const { proxy } = await this._getRuntime();

        return await proxy.call(this.runTestFn, { id, functionName, testRunId });
    }

    public async cleanUp (): Promise<void> {
        const { proxy } = await this._getRuntime();

        await proxy.call(this.cleanUp);
    }

    public async setOptions ({ value }: SetOptionsArguments): Promise<void> {
        const { proxy } = await this._getRuntime();

        const preparedOptions = prepareOptions(value);

        await proxy.call(this.setOptions, { value: preparedOptions });
    }

    public async onRequestHookEvent ({ name, testId, hookId, eventData }: RequestHookEventArguments): Promise<void> {
        const { proxy } = await this._getRuntime();

        await proxy.call(this.onRequestHookEvent, {
            name,
            testId,
            hookId,
            eventData: this._prepareEventData(eventData)
        });
    }

    public async setMock ({ testId, hookId, ruleId, responseEventId, mock }: SetMockArguments): Promise<void> {
        const mockDefinedWithPredicate = mock.isPredicate;

        mock = ResponseMock.from(mock);

        if (mockDefinedWithPredicate)
            this._wrapMockPredicate({ mock, testId, hookId, ruleId });

        await this.emit('setMock', [responseEventId, mock]);
    }

    public async setConfigureResponseEventOptions ({ eventId, opts }: SetConfigureResponseEventOptionsArguments): Promise<void> {
        await this.emit('setConfigureResponseEventOptions', [eventId, opts]);
    }

    public async setHeaderOnConfigureResponseEvent ({ eventId, headerName, headerValue }: SetHeaderOnConfigureResponseEventArguments): Promise<void> {
        await this.emit('setHeaderOnConfigureResponseEvent', [eventId, headerName, headerValue]);
    }

    public async removeHeaderOnConfigureResponseEvent ({ eventId, headerName }: RemoveHeaderOnConfigureResponseEventArguments): Promise<void> {
        await this.emit('removeHeaderOnConfigureResponseEvent', [eventId, headerName]);
    }

    public async executeRequestFilterRulePredicate ({ testId, hookId, ruleId, requestInfo }: ExecuteRequestFilterRulePredicateArguments): Promise<boolean> {
        const { proxy } = await this._getRuntime();

        return await proxy.call(this.executeRequestFilterRulePredicate, { testId, hookId, ruleId, requestInfo });
    }

    public async executeMockPredicate ({ testId, hookId, ruleId, requestInfo, res }: ExecuteMockPredicate): Promise<IncomingMessageLikeInitOptions> {
        const { proxy } = await this._getRuntime();

        return await proxy.call(this.executeMockPredicate, { testId, hookId, ruleId, requestInfo, res });
    }

    public async getWarningMessages ({ testRunId }: GetWarningMessagesArguments): Promise<string[]> {
        const { proxy } = await this._getRuntime();

        return proxy.call(this.getWarningMessages, { testRunId });
    }

    public async addRequestEventListeners ( { hookId, hookClassName, rules }: AddRequestEventListenersArguments): Promise<void> {
        rules = RequestFilterRule.fromArray(rules as object[]);

        await this.emit('addRequestEventListeners', { hookId, hookClassName, rules });
    }

    public async removeRequestEventListeners ({ rules }: RemoveRequestEventListenersArguments): Promise<void> {
        rules = RequestFilterRule.fromArray(rules as object[]);

        await this.emit('removeRequestEventListeners', { rules });
    }

    public async initializeTestRunData ({ testRunId, testId }: InitializeTestRunDataArguments): Promise<void> {
        const { proxy } = await this._getRuntime();

        return proxy.call(this.initializeTestRunData, { testRunId, testId });
    }

    public async enableDebug (): Promise<void> {
        const { proxy } = await this._getRuntime();

        return proxy.call(this.enableDebug);
    }

    public async disableDebug (): Promise<void> {
        const { proxy } = await this._getRuntime();

        return proxy.call(this.disableDebug);
    }
}
