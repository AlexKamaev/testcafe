import { PNG } from 'pngjs';
import Promise from 'pinkie';
import promisifyEvent from 'promisify-event';
import fs from 'fs';
import { MARK_BYTES_PER_PIXEL } from "../screenshots/constants";

export function readPng (buffer) {
    const png = new PNG();

    const parsedPromise = Promise.race([
        promisifyEvent(png, 'parsed'),
        promisifyEvent(png, 'error')
    ]);

    png.parse(buffer);

    return parsedPromise
        .then(() => png);
}

export function writePng (filePath, png) {
    const outStream = fs.createWriteStream(filePath);
    const pngStream = png.pack();

    const finishPromise = Promise.race([
        promisifyEvent(outStream, 'finish'),
        promisifyEvent(outStream, 'error'),
        promisifyEvent(pngStream, 'error')
    ]);

    pngStream.pipe(outStream);

    return finishPromise;
}

export function copyImagePart (pngImage, { clipLeft, clipTop, clipRight, clipBottom }) {
    const width  = clipRight - clipLeft;
    const height = clipBottom - clipTop;

    const dstImage = new PNG({ width, height });

    const stride = dstImage.width * MARK_BYTES_PER_PIXEL;

    for (let i = 0; i < height; i++) {
        const srcStartIndex = (pngImage.width * (i + clipTop) + clipLeft) * MARK_BYTES_PER_PIXEL;

        pngImage.data.copy(dstImage.data, stride * i, srcStartIndex, srcStartIndex + stride);
    }

    return dstImage;
}
