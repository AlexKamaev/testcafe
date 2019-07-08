import { runInThisContext } from 'vm';
import { createRequireFromPath } from 'module';
import { dirname } from 'path';
import { ActionExecuteNodeJSExpressionError } from "../errors/test-run";

const ERROR_LINE_COLUMN_REGEXP = /:(\d):(\d)/;
const ERROR_LINE_OFFSET        = -3;
const ERROR_COLUMN_OFFSET      = -4;


// NOTE: do not beautify this code since offsets for for error lines and columns are coded here
function wrapModule (expression) {
    return `(function(require, t, __filename, __dirname){
    const res = 
    ${expression};
    return res;
    });`;
}

function formatExpression (expression) {
    const expresionMessage = expression.split('\n');

    expresionMessage.splice(0, 1);
    expresionMessage.splice(expresionMessage.length - 1, 1);

    return 'function [Code step]\n' + expresionMessage.map(str => {
        return `          ${str}`;
    }).join('\n');
}

function getErrorLineColumn (err) {
    const result = err.stack.match(ERROR_LINE_COLUMN_REGEXP);

    const line   = parseInt(result[1], 10);
    const column = parseInt(result[2], 10);

    return { line, column }
}

export default function (expression, testRun, callsite) {
    const filename = testRun.test.testFile.filename;
    const dirName  = dirname(filename);
    const require  = createRequireFromPath(filename);

    debugger;
    const fn = runInThisContext(wrapModule(expression), {
        filename:     formatExpression(expression),
        lineOffset:   ERROR_LINE_OFFSET,
        columnOffset: ERROR_COLUMN_OFFSET
    });

    return fn(require, testRun.controller, filename, dirName)()
        .catch(err => {
            debugger;

            const { line, column } = getErrorLineColumn(err);

            debugger;

            throw new ActionExecuteNodeJSExpressionError(err, expression, line, column, callsite)
        });

}
