const CACHE_VERSION = "v1";

async function handleRequest(event) {
    const responsePromise = getResponse(event);
    event.respondWith(responsePromise);
}

async function getResponse(event) {
    try {
        return await fetchAndCache(event);
    } catch {
        return await getFromCache(event);
    }
}

async function fetchAndCache(event) {
    const request = event.request;

    const response = await fetch(request);

    const cache = await caches.open(CACHE_VERSION);
    await cache.put(request, response.clone());

    return response;
}

async function getFromCache(event) {
    const request = event.request;

    const cache = await caches.open(CACHE_VERSION);
    const response = await cache.match(request);

    return response;
}

self.addEventListener("fetch", (event) => {
    handleRequest(event);
});
