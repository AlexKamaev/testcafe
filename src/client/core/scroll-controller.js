import { eventSandbox, Promise } from './deps/hammerhead';
import { EventEmitter } from './utils/service';
import { domUtils } from './';

const listeners = eventSandbox.listeners;

class ScrollController {
    constructor () {
        this.initialized         = false;
        this.stopPropagationFlag = false;

        this.events = new EventEmitter();
    }

    _internalListener (event, dispatched, preventEvent, cancelHandlers, stopPropagation) {
        this.events.emit('scroll', event);

        if (this.stopPropagationFlag) {
            cancelHandlers();
            stopPropagation();
        }
    }

    init () {
        if (this.initialized)
            return;

        this.initialized = true;

        listeners.initElementListening(window, ['scroll']);
        listeners.addFirstInternalHandler(window, ['scroll'], (...args) => this._internalListener(...args));
    }

    waitForScroll (scrollElement) {
        let promiseResolver = null;

        const promise = new Promise(resolve => {
            promiseResolver = resolve;
        });

        promise.cancel = () => this.events.off('scroll', promiseResolver);

        if (this.initialized)
            this.handleScrollEvents(scrollElement, promiseResolver);
        else
            promiseResolver();

        return promise;
    }

    handleScrollEvents (el, handler) {
        this.events.once('scroll', handler);

        const isShadowElement = el.getRootNode && domUtils.findDocument(el) !== el.getRootNode();

        if (isShadowElement) {
            listeners.initElementListening(el, ['scroll']);
            listeners.addFirstInternalHandler(el, ['scroll'], (...args) => {
                this._internalListener(...args);

                listeners.cancelElementListening(el);
            });
        }
    }

    stopPropagation () {
        this.stopPropagationFlag = true;
    }

    enablePropagation () {
        this.stopPropagationFlag = false;
    }
}

export default new ScrollController();
