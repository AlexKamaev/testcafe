'use strict';

const restoreCursor = require('./restore-cursor');

let hidden = false;

exports.show = function (stream) {
    const s = stream || process.stderr;

    if (!s.isTTY)
        return;


    hidden = false;
    s.write('\u001b[?25h');
};

exports.hide = function (stream) {
    const s = stream || process.stderr;

    if (!s.isTTY)
        return;

    restoreCursor();

    hidden = true;

    s.write('\u001b[?25l');
};

exports.toggle = function (force, stream) {
    if (force !== void 0)
        hidden = force;

    if (hidden)
        exports.show(stream);
    else
        exports.hide(stream);
};
