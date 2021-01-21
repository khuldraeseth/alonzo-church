/**
 * Waits for the given amount of MS.
 * @param {number} ms
 * @returns {Promise<void>}
 */
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Returns a callback which provides access to a locally-cached value. This is essentially a lazy-load variable.
 * @template T
 * @param {function(): Promise<T>} retrieve
 * @returns {function(): Promise<T>}
 */
const cached = retrieve => {
    let cachedValue;

    return async () => {
        if (cachedValue == null) {
            cachedValue = await retrieve();
        }
        return cachedValue;
    }
}

exports.pause = pause;
exports.cached = cached;