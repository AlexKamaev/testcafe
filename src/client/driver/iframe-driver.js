import { Promise, eventSandbox } from './deps/hammerhead';
import { pageUnloadBarrier } from './deps/testcafe-core';
import { IframeStatusBar } from './deps/testcafe-ui';
import Driver from './driver';
import ContextStorage from './storage';
import DriverStatus from './status';
import ParentIframeDriverLink from './driver-link/iframe/parent';
import { ChildWindowOpenedInFrameMessage, WaitForChildWindowOpenedInFrameMessage, TYPE as MESSAGE_TYPE } from './driver-link/messages';
import IframeNativeDialogTracker from './native-dialog-tracker/iframe';
import sendMessageToDriver from './driver-link/send-message-to-driver';
import { WAIT_FOR_WINDOW_DRIVER_RESPONSE_TIMEOUT } from './driver-link/timeouts';
import { CannotSwitchToWindowError } from '../../shared/errors';

// const messageSandbox = eventSandbox.message;

export default class IframeDriver extends Driver {
    constructor (testRunId, options) {
        super(testRunId, {}, {}, options);

        this.lastParentDriverMessageId = null;
        this.parentDriverLink          = new ParentIframeDriverLink(window.parent);
        this._initParentDriverListening();
    }

    // Errors handling
    _onJsError () {
        // NOTE: do nothing because hammerhead sends js error to the top window directly
    }

    _onConsoleMessage () {
        // NOTE: do nothing because hammerhead sends console messages to the top window directly
    }

    // _initChildDriverListening () {
    //     messageSandbox.on(messageSandbox.SERVICE_MSG_RECEIVED_EVENT, e => {
    //         const msg    = e.message;
    //         const window = e.source;
    //
    //         switch (msg.type) {
    //             case MESSAGE_TYPE.establishConnection:
    //                 this._addChildIframeDriverLink(msg.id, window);
    //                 break;
    //             case MESSAGE_TYPE.setAsMaster:
    //                 this._handleSetAsMasterMessage(msg, window);
    //                 break;
    //             case MESSAGE_TYPE.switchToWindow:
    //                 this._handleSwitchToWindow(msg, window);
    //                 break;
    //             case MESSAGE_TYPE.closeWindow:
    //                 this._handleCloseWindow(msg, window);
    //                 break;
    //             case MESSAGE_TYPE.switchToWindowValidation:
    //                 this._handleSwitchToWindowValidation(msg, window);
    //                 break;
    //             case MESSAGE_TYPE.closeWindowValidation:
    //                 this._handleCloseWindowValidation(msg, window);
    //                 break;
    //             case MESSAGE_TYPE.getWindows:
    //                 this._handleGetWindows(msg, window);
    //                 break;
    //             case MESSAGE_TYPE.closeAllChildWindows:
    //                 this._handleCloseAllWindowsMessage(msg, window);
    //                 break;
    //             case MESSAGE_TYPE.startToRestoreChildLink:
    //                 this._handleStartToRestoreChildLinkMessage();
    //                 break;
    //             case MESSAGE_TYPE.restoreChildLink:
    //                 this._handleRestoreChildLink(msg, window);
    //         }
    //     });
    // }

    _onChildWindowOpened (e) {
        // this._addChildWindowDriverLink(e);
        // this._switchToChildWindow(e.windowId);
        // this.parentDriverLink.addChildWindowToParent(e);
        // // debugger;

        this._stopInternal();

        sendMessageToDriver(new WaitForChildWindowOpenedInFrameMessage(), window.top, 30000, CannotSwitchToWindowError);



        // window.top['%hammerhead%'].sandbox.childWindow.emit('hammerhead|event|window-opened', e);
    }


    // Messaging between drivers
    _initParentDriverListening () {
        eventSandbox.message.on(eventSandbox.message.SERVICE_MSG_RECEIVED_EVENT, e => {
            const msg = e.message;

            pageUnloadBarrier
                .wait(0)
                .then(() => {
                    // NOTE: the parent driver repeats commands sent to a child driver if it doesn't get a confirmation
                    // from the child in time. However, confirmations sent by child drivers may be delayed when the browser
                    // is heavily loaded. That's why the child driver should ignore repeated messages from its parent.
                    if (msg.type === MESSAGE_TYPE.executeCommand) {
                        if (this.lastParentDriverMessageId === msg.id)
                            return;

                        this.lastParentDriverMessageId = msg.id;

                        this.readyPromise.then(() => {
                            this.speed = msg.testSpeed;

                            this.parentDriverLink.sendConfirmationMessage(msg.id);
                            this._onCommand(msg.command);
                        });
                    }

                    if (msg.type === MESSAGE_TYPE.setNativeDialogHandler) {
                        this.nativeDialogsTracker.setHandler(msg.dialogHandler);
                        this._setNativeDialogHandlerInIframes(msg.dialogHandler);
                    }
                });
        });
    }

    // Commands handling
    _onSwitchToMainWindowCommand (command) {
        this._switchToMainWindow(command);
    }

    //
    // Routing
    _onReady (status) {
        this.parentDriverLink.onCommandExecuted(status);
    }

    // _sendReadyStatus (status) {
    //     const inWindowSwitching = this.contextStorage.getItem(this.PENDING_WINDOW_SWITCHING_FLAG);
    //
    //     if (!inWindowSwitching)
    //         this.parentDriverLink.onCommandExecuted(status);
    //     else {
    //         this._sendStatus(status)
    //             .then(command => {
    //                 // debugger;;
    //
    //                 if (this._isEmptyCommandInPendingWindowSwitchingMode(command))
    //                     this.emit('empty-command-event');
    //                 else
    //                     throw new Error('kekeke');
    //                     // this.parentDriverLink.onCommandExecuted(status);
    //             });
    //     }
    // }

    _prepareStatus (status) {
        this._addPendingWindowSwitchingStateToStatus(status);
    }


    // API
    start () {
        this.nativeDialogsTracker = new IframeNativeDialogTracker(this.dialogHandler);
        this.statusBar            = new IframeStatusBar();

        const initializePromise = this.parentDriverLink
            .establishConnection()
            .then(id => {
                this.contextStorage = new ContextStorage(window, id, this.windowId);

                if (this._failIfClientCodeExecutionIsInterrupted())
                    return;

                const inCommandExecution = this.contextStorage.getItem(this.COMMAND_EXECUTING_FLAG) ||
                                         this.contextStorage.getItem(this.EXECUTING_IN_IFRAME_FLAG);

                if (inCommandExecution) {
                    this.contextStorage.setItem(this.COMMAND_EXECUTING_FLAG, false);
                    this.contextStorage.setItem(this.EXECUTING_IN_IFRAME_FLAG, false);
                    this._onReady(new DriverStatus({ isCommandResult: true }));
                }
            });

        this.readyPromise = Promise.all([this.readyPromise, initializePromise]);
    }
}
