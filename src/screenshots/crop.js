import fs from 'fs';
import Promise from 'pinkie';
import { PNG } from 'pngjs';
import promisifyEvent from 'promisify-event';
import limitNumber from '../utils/limit-number';
import { deleteFile, readFile } from '../utils/promisified-functions';
import renderTemplate from '../utils/render-template';
import { InvalidElementScreenshotDimensionsError } from '../errors/test-run/';
import { MARK_LENGTH, MARK_RIGHT_MARGIN, MARK_BYTES_PER_PIXEL } from './constants';
import WARNING_MESSAGES from '../notifications/warning-message';
import { assertType, is } from '../errors/runtime/type-assertions';

function readPng (buffer) {
    const png = new PNG();

    const parsedPromise = Promise.race([
        promisifyEvent(png, 'parsed'),
        promisifyEvent(png, 'error')
    ]);

    png.parse(buffer);

    return parsedPromise
        .then(() => png);
}

function writePng (filePath, png) {
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

function markSeedToId (markSeed) {
    let id = 0;

    for (let i = 0; i < MARK_LENGTH; i++)
        id = id * 2 + (markSeed[i * MARK_BYTES_PER_PIXEL] ? 1 : 0);

    return id;
}

function getClientAreaDimensions (png, path, markSeed, { width, height }) {
    const mark = Buffer.from(markSeed);

    const markIndex = png.data.indexOf(mark);

    if (markIndex < 0)
        throw new Error(renderTemplate(WARNING_MESSAGES.screenshotMarkNotFound, path, markSeedToId(markSeed)));

    const endPosition = markIndex / MARK_BYTES_PER_PIXEL + MARK_LENGTH + MARK_RIGHT_MARGIN;

    const clipRight  = endPosition % png.width || png.width;
    const clipBottom = (endPosition - clipRight) / png.width + 1;
    const clipLeft   = clipRight - width;
    const clipTop    = clipBottom - height;

    return {
        clipLeft,
        clipTop,
        clipRight,
        clipBottom,
        markLineNumber: clipBottom
    };
}

// function detectCropDimensions (imageWidth, imageHeight, cropDimensions) {
function detectCropDimensions ({ clipRight, clipLeft, clipBottom, clipTop }, cropDimensions) {
    if (cropDimensions) {
        const { right, top, bottom, left } = cropDimensions;

        assertType(is.nonNegativeNumber, 'detectCropDimensions', '"right" option', right);
        assertType(is.nonNegativeNumber, 'detectCropDimensions', '"right" option', top);
        assertType(is.nonNegativeNumber, 'detectCropDimensions', '"right" option', bottom);
        assertType(is.nonNegativeNumber, 'detectCropDimensions', '"right" option', left);

        clipRight  = Math.min(right, clipRight);
        clipBottom = Math.min(bottom, clipBottom);
        clipLeft   = Math.min(left, clipRight);
        clipTop    = Math.min(top, clipBottom);
    }

    return {
        clipLeft,
        clipTop,
        clipRight,
        clipBottom,
        clipWidth:  clipRight - clipLeft,
        clipHeight: clipBottom - clipTop
    };
}

function detectClippingArea (srcImage, markSeed, clientAreaDimensions, cropDimensions) {
    let clipLeft   = 0;
    let clipTop    = 0;
    let clipRight  = srcImage.width;
    let clipBottom = srcImage.height;

    let clipWidth  = srcImage.width;
    let clipHeight = srcImage.height;

    if (markSeed && clientAreaDimensions) {
        const mark = Buffer.from(markSeed);

        const markIndex = srcImage.data.indexOf(mark);

        if (markIndex < 0)
            return null;

        const endPosition = markIndex / MARK_BYTES_PER_PIXEL + MARK_LENGTH + MARK_RIGHT_MARGIN;

        clipRight  = endPosition % srcImage.width || srcImage.width;
        clipBottom = (endPosition - clipRight) / srcImage.width + 1;
        clipLeft   = clipRight - clientAreaDimensions.width;
        clipTop    = clipBottom - clientAreaDimensions.height;
    }

    const markLineNumber = clipBottom;

    if (cropDimensions) {
        clipRight  = limitNumber(clipLeft + cropDimensions.right, clipLeft, clipRight);
        clipBottom = limitNumber(clipTop + cropDimensions.bottom, clipTop, clipBottom);
        clipLeft   = limitNumber(clipLeft + cropDimensions.left, clipLeft, clipRight);
        clipTop    = limitNumber(clipTop + cropDimensions.top, clipTop, clipBottom);
    }

    if (markSeed && clipBottom === markLineNumber)
        clipBottom -= 1;

    clipWidth  = clipRight - clipLeft;
    clipHeight = clipBottom - clipTop;

    return {
        left:   clipLeft,
        top:    clipTop,
        right:  clipRight,
        bottom: clipBottom,
        width:  clipWidth,
        height: clipHeight
    };
}

function copyImagePart (srcImage, { clipLeft, clipTop, clipWidth, clipHeight }) {
    const dstImage = new PNG({ width: clipWidth, height: clipHeight });
    const stride   = dstImage.width * MARK_BYTES_PER_PIXEL;

    for (let i = 0; i < clipHeight; i++) {
        const srcStartIndex = (srcImage.width * (i + clipTop) + clipLeft) * MARK_BYTES_PER_PIXEL;

        srcImage.data.copy(dstImage.data, stride * i, srcStartIndex, srcStartIndex + stride);
    }

    return dstImage;
}

export async function cropScreenshotByCoordinates (binaryImage, cropDimensions) {
    let png = await readPng(binaryImage);

}

export async function cropScreenshotBinary (path, markSeed, clientAreaDimensions, cropDimensions, binaryImage) {
    // console.log('cropScreenshotBinary');
    // console.log(binaryImage);

    let png = await readPng(binaryImage);

    // console.log('lelele');

    let clip = {
        clipRight:      png.width,
        clipBottom:     png.height,
        clipLeft:       0,
        clipTop:        0
    };

    let markLineNumber = null;

    if (markSeed && clientAreaDimensions) {
        clip = getClientAreaDimensions(png, path, markSeed, clientAreaDimensions);

        markLineNumber = clip.clipBottom;
    }
    // clippingArea         = detectClippingArea(png, markSeed, clientAreaDimensions, cropDimensions);

    clip = detectCropDimensions(clip, cropDimensions);

    if (markSeed && clip.clipBottom === markLineNumber) {
        clip.clipBottom--;
        clip.clipHeight--;
    }

    // console.log(clippingArea);
    // console.log(clippingArea1)

    if (clip.clipWidth <= 0 || clip.clipHeight <= 0)
        throw new InvalidElementScreenshotDimensionsError(clip.clipWidth, clip.clipHeight);

    // console.log('1');
    // console.log(clip)
    //
    // console.log(detectClippingArea(png, markSeed, clientAreaDimensions, cropDimensions))

    if (markSeed || cropDimensions) {
        // console.log('2');
        png = copyImagePart(png, clip);
        // console.log('3');

        await writePng(path, png);

        // console.log(path);
        // console.log(png);
        // console.log('4');
    }
}

export async function cropScreenshotByPath (path, markSeed, clientAreaDimensions, cropDimensions) {
    const sourceImage = await readFile(path);

    try {
        await cropScreenshotBinary(path, markSeed, clientAreaDimensions, cropDimensions, sourceImage);
    }
    catch (err) {
        await deleteFile(path);

        throw err;
    }
}
