import { runInThisContext } from 'vm';
import { createRequireFromPath } from 'module';
import { dirname } from 'path';

const ERROR_LINE_OFFSET   = -3;
const ERROR_COLUMN_OFFSET = -4;

// NOTE: do not beautify this code since offsets for for error lines and columns are coded here
function wrapModule (expression) {
    return `(function(require, t, __filename, __dirname){
    const res = 
    ${expression};
    return res;
    });`;
}

export default function (expression, testRun) {
    const filename = testRun.test.testFile.filename;
    const dirName  = dirname(filename);
    const require  = createRequireFromPath(filename);

    let expresionMessage = expression.split('\n');

    expresionMessage.splice(0, 1);
    expresionMessage.splice(expresionMessage.length - 1, 1);

    expresionMessage = 'function [Code step]\n' + expresionMessage.map(str => {
        return `          ${str}`;
    }).join('\n');

    const fn = runInThisContext(wrapModule(expression), {
        filename:     expresionMessage,
        lineOffset:   ERROR_LINE_OFFSET,
        columnOffset: ERROR_COLUMN_OFFSET
    });

    return fn(require, testRun.controller, filename, dirName)();
}
