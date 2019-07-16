import { runInThisContext, runInNewContext } from 'vm';
import Module from 'module';
import { dirname } from 'path';
import { ExecuteNodeExpressionError } from '../errors/test-run';
import SelectorBuilder from "../client-functions/selectors/selector-builder";
import ClientFunctionBuilder from "../client-functions/client-function-builder";

const ERROR_LINE_COLUMN_REGEXP = /:(\d+):(\d+)/;
const ERROR_LINE_OFFSET        = -1;
const ERROR_COLUMN_OFFSET      = -4;

// NOTE: do not beautify this code since offsets for for error lines and columns are coded here
function wrapModule (expression) {
    return '(async function() {\n' +
           expression + ';\n' +
           '});';
}

function getErrorLineColumn (err) {
    const result = err.stack.match(ERROR_LINE_COLUMN_REGEXP);

    const line   = parseInt(result[1], 10);
    const column = parseInt(result[2], 10);

    return { line, column };
}

function formatExpression (expression) {
    const expresionMessage = expression.split('\n');

    return 'function [Code step]\n' + expresionMessage.map(str => {
        return ' '.repeat(10) + str;
    }).join('\n');
}

function createRequire (filename) {
    if (Module.createRequireFromPath)
        return Module.createRequireFromPath(filename);

    const dummyModule = new Module(filename, module);

    dummyModule.filename = filename;
    dummyModule.paths    = [filename].concat(module.paths);

    return id => dummyModule.require(id);
}

function createSelectorDefinition (testRun, opts = {}) {
    return (fn, options = {}) => {
        const { skipVisibilityCheck, collectionMode } = opts;

        if (skipVisibilityCheck)
            options.visibilityCheck = false;

        if (testRun && testRun.id)
            options.boundTestRun = testRun;

        if (collectionMode)
            options.collectionMode = collectionMode;

        const builder = new SelectorBuilder(fn, options, { instantiation: 'Selector' });

        return builder.getFunction();
    };
}

function createClientFunctionDefinition (testRun) {
    return (fn, options = {}) => {
        if (testRun && testRun.id)
            options.boundTestRun = testRun;

        const builder = new ClientFunctionBuilder(fn, options, { instantiation: 'ClientFunction' });

        return builder.getFunction();
    }
}

function createProxyForGlobalObject (testRun) {
    const filename = testRun.test.testFile.filename;
    const dirName  = dirname(filename);

    const proxyHandler = {
        require:        createRequire(filename),
        __filename:     filename,
        __dirname:      dirName,
        t:              testRun.controller,
        Selector:       createSelectorDefinition(testRun),
        ClientFunction: createClientFunctionDefinition(testRun)
    };

    return new Proxy(global, {
        get: (target, property) => {
            return proxyHandler[property] || target[property];
        }
    });
}

export default async function (expression, testRun, callsite) {
    const proxy = createProxyForGlobalObject(testRun);

    try {
        return await runInNewContext(wrapModule(expression), proxy, {
            filename:     formatExpression(expression),
            lineOffset:   ERROR_LINE_OFFSET,
            columnOffset: ERROR_COLUMN_OFFSET
        })();
    } catch (err) {
        const { line, column } = getErrorLineColumn(err);

        throw new ExecuteNodeExpressionError(err, expression, line, column, callsite);
    }
}
