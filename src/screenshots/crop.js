import { readPng, writePng, copyImagePart } from '../utils/png';
import { deleteFile, readFile } from '../utils/promisified-functions';
import renderTemplate from '../utils/render-template';
import { InvalidElementScreenshotDimensionsError } from '../errors/test-run/';
import { MARK_LENGTH, MARK_RIGHT_MARGIN, MARK_BYTES_PER_PIXEL } from './constants';
import WARNING_MESSAGES from '../notifications/warning-message';
import { assertType, is } from '../errors/runtime/type-assertions';

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
        clipBottom
    };
}

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
        clipBottom
    };
}

async function getClip (png, path, markSeed, clientAreaDimensions, cropDimensions) {
    let clip = {
        clipRight:  png.width,
        clipBottom: png.height,
        clipLeft:   0,
        clipTop:    0
    };

    let markLineNumber = null;

    if (markSeed && clientAreaDimensions) {
        clip = getClientAreaDimensions(png, path, markSeed, clientAreaDimensions);

        markLineNumber = clip.clipBottom;
    }

    clip = detectCropDimensions(clip, cropDimensions);

    if (markSeed && clip.clipBottom === markLineNumber)
        clip.clipBottom--;

    const clipWidth  = clip.clipRight - clip.clipLeft;
    const clipHeight = clip.clipBottom - clip.clipTop;

    if (clipWidth <= 0 || clipHeight <= 0)
        throw new InvalidElementScreenshotDimensionsError(clipWidth, clipHeight);

    return clip;
}

export async function cropScreenshotBinary (path, markSeed, clientAreaDimensions, cropDimensions, binaryImage) {
    const png = await readPng(binaryImage);

    const clip = await getClip(png, path, markSeed, clientAreaDimensions, cropDimensions);

    console.log(clip);

    if (markSeed || cropDimensions)
        return copyImagePart(png, clip);

    return null;
}

export async function cropScreenshotByPath (path, markSeed, clientAreaDimensions, cropDimensions) {
    const sourceImage = await readFile(path);

    return await cropScreenshotBinary(path, markSeed, clientAreaDimensions, cropDimensions, sourceImage);
}
