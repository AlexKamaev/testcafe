import hammerhead from '../../deps/hammerhead';
import testCafeCore from '../../deps/testcafe-core';
import VisibleElementAutomation from '../visible-element-automation';
import createClickCommand from './click-command';
import MouseDownAutomation from '../mouse-down';
import MouseUpAutomation from '../mouse-up';

const Promise = hammerhead.Promise;

const extend = hammerhead.utils.extend;

const domUtils = testCafeCore.domUtils;
const delay    = testCafeCore.delay;


export default class ClickAutomation extends VisibleElementAutomation {
    constructor (element, clickOptions) {
        super(element, clickOptions);

        this.modifiers = clickOptions.modifiers;
        this.caretPos  = clickOptions.caretPos;

        this.targetElementParentNodes     = [];
        this.activeElementBeforeMouseDown = null;
        this.mouseDownElement             = null;
    }

    get downState () {
        return this.mouseDownAutomation?.eventState;
    }

    get upState () {
        return this.mouseUpAutomation?.upState;
    }

    _mousedown (eventArgs) {
        this.targetElementParentNodes = domUtils.getParents(eventArgs.element);
        this.mouseDownElement         = eventArgs.element;

        this.mouseDownAutomation = new MouseDownAutomation(null, this.options, eventArgs);

        return this.mouseDownAutomation.run();
    }

    // _mouseup (eventArgs) {
    //     return cursor
    //         .buttonUp()
    //         .then(() => this._getElementForEvent(eventArgs))
    //         .then(element => {
    //             eventArgs.element = element;
    //
    //             this.eventState.clickElement = ClickAutomation._getElementForClick(this.mouseDownElement, element,
    //                 this.targetElementParentNodes);
    //
    //
    //             let timeStamp = {};
    //
    //             const getTimeStamp = e => {
    //                 timeStamp = e.timeStamp;
    //
    //                 listeners.removeInternalEventBeforeListener(window, ['mouseup'], getTimeStamp);
    //             };
    //
    //             if (!browserUtils.isIE)
    //                 listeners.addInternalEventBeforeListener(window, ['mouseup'], getTimeStamp);
    //
    //             if (!this._isTouchEventWasCancelled())
    //                 eventSimulator.mouseup(element, eventArgs.options);
    //
    //             return { timeStamp };
    //         });
    // }

    // _click (eventArgs) {
    //     const clickCommand = createClickCommand(this.eventState, eventArgs);
    //
    //     if (!this._isTouchEventWasCancelled()) {
    //         clickCommand.run();
    //     }
    //
    //     return eventArgs;
    // }

    run (useStrictElementCheck) {
        let eventArgs = null;

        return this
            ._ensureElement(useStrictElementCheck)
            .then(({ element, clientPoint, screenPoint, devicePoint }) => {
                eventArgs = {
                    point:       clientPoint,
                    screenPoint: screenPoint,
                    element:     element,
                    options:     extend({
                        clientX: clientPoint.x,
                        clientY: clientPoint.y,
                        screenX: devicePoint.x,
                        screenY: devicePoint.y
                    }, this.modifiers)
                };

                // NOTE: we should raise mouseup event with 'mouseActionStepDelay' after we trigger
                // mousedown event regardless of how long mousedown event handlers were executing
                return Promise.all([delay(this.automationSettings.mouseActionStepDelay), this._mousedown(eventArgs)]);
            })
            .then(() => {
                this.mouseUpAutomation = new MouseUpAutomation(null, this.options, this.mouseDownAutomation.eventState, eventArgs);

                return this.mouseUpAutomation.run();
            });
    }
}
