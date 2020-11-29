const MAX_RETRY   = 10;
const RETRY_DELAY = 500;

const PAGE_FETCH_MODE = 'navigate';

function delay (ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function tryGetResponse (request) {
    try {
        // debugger;

        const result = await fetch(request);

        debugger;

        console.log(result);

        return { response: result };
        // return { response: await fetch(request) };
    }
    catch (error) {
        console.log(error);

        return { error };
    }
}

async function getResponse (request) {
    console.log('getResponse');
    let { error, response } = await tryGetResponse(request);
    let retryAttempt        = 0;

    debugger;

    while (error && retryAttempt < MAX_RETRY) {
        console.log('+++');
        debugger;
        // eslint-disable-next-line no-console
        console.log(error.stack || error);

        retryAttempt += 1;

        await delay(RETRY_DELAY);

        ({ error, response } = await tryGetResponse(request));
    }

    if (error)
        throw error;

    return response;
}

self.addEventListener('fetch', event => {
    if (event.request.mode !== PAGE_FETCH_MODE)
        return;

    event.respondWith(getResponse(event.request));
    // event.preventDefault();
});

self.addEventListener('install', () => {
    self.skipWaiting();
});
