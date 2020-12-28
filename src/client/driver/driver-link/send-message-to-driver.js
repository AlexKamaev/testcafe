import {
    Promise,
    eventSandbox,
    nativeMethods
} from '../deps/hammerhead';

import { delay } from '../deps/testcafe-core';
import { TYPE as MESSAGE_TYPE } from './messages';

const MIN_RESPONSE_WAITING_TIMEOUT = 2500;
const RESEND_MESSAGE_INTERVAL      = 1000;

export default function sendMessageToDriver (msg, driverWindow, timeout, NotLoadedErrorCtor) {
    let sendMsgInterval  = null;
    const sendMsgTimeout = null;
    let onResponse       = null;

    timeout = Math.max(timeout || 0, MIN_RESPONSE_WAITING_TIMEOUT);

    const sendAndWaitForResponse = (message) => {
        console.log('send message to driver: ' + message.type + ' ' + message.id + ' ' + Date.now());
        return new Promise(resolve => {

            onResponse = e => {
                console.log('onResponse: ' + e.message.type + ' ' + e.message.id + ' ' + Date.now());
                if (e.message.type === MESSAGE_TYPE.confirmation && e.message.requestMessageId === message.id) {
                    console.log('resolve: ' + e.message.type + ' ' + e.message.id + ' ' + Date.now());
                    console.log('resolve: ' + e.message.type + ' ' + e.message.id + ' ' + Date.now());
                    resolve(e.message);
                }
            };

            eventSandbox.message.on(eventSandbox.message.SERVICE_MSG_RECEIVED_EVENT, onResponse);

            sendMsgInterval = nativeMethods.setInterval.call(window, () => {
                console.log('resend: ' + message.type + ' ' + message.id + ' ' + Date.now());
                return eventSandbox.message.sendServiceMsg(msg, driverWindow);
            }, RESEND_MESSAGE_INTERVAL);
            eventSandbox.message.sendServiceMsg(message, driverWindow);
        });
    };

    return Promise.race([delay(timeout), sendAndWaitForResponse(msg)])
        .then(response => {
            console.log('race finished: ' + msg.id + ' ' + Date.now());
            nativeMethods.clearInterval.call(window, sendMsgInterval);
            nativeMethods.clearTimeout.call(window, sendMsgTimeout);
            eventSandbox.message.off(eventSandbox.message.SERVICE_MSG_RECEIVED_EVENT, onResponse);

            if (!response)
                throw new NotLoadedErrorCtor();

            return response;
        });
}
