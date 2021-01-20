/**
 * Waits for the given amount of MS.
 * @param {number} ms
 * @returns {Promise<void>}
 */
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
exports.pause = pause;