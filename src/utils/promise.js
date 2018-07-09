import Promise from 'pinkie';
// import { GeneralError } from '../errors/runtime';
// import { getCallsiteForError } from '../errors/get-callsite';
// import ReporterPluginHost from '../reporter/plugin-host';
// import TestRunErrorFormattableAdapter from '../errors/test-run/formattable-adapter';
// import TEST_RUN_PHASE from '../test-run/phase';

// function isCallsiteFrame () {
//     var count = 0;
//
//     return function () {
//         count++;
//
//         return count > 1;
//     };
// }

export default class extends Promise {
    constructor (executor) {
        super((resolve, reject) => {
            return executor(resolve, reject);
        });

        // debugger
        //
        // this.error = new GeneralError('Unhandled promise rejection');
        //
        // this.error.testRunPhase = TEST_RUN_PHASE.initial;
        //
        // this.callsite = getCallsiteForError(this.error, isCallsiteFrame());
        // this.error.callsite = this.callsite;
        // this.error.type = 'unhandledPromiseRejectionError';
        //
        // var reporterPluginHost = new ReporterPluginHost({ noColors: false });
        //
        // var errAdapter = new TestRunErrorFormattableAdapter(this.error, { });
        //
        // errAdapter.stackFilter = () => true;
        //
        // var q = reporterPluginHost.formatError(errAdapter);
        //
        // this.q = q;
        //
        // debugger;
        //
        // this.error.formatted = q;
        //
        // console.log(q);
        this.error = new Error('Unhandled promise rejection');
    }
}

