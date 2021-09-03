// Storing data in a JSON file instead of a real database is heavily discouraged,
// but it should be fine in this case since we're only tracking a single list that changes very infrequently.
// If that changes, migrate off of JSON as soon as possible.

const { promises: fs } = require('fs');
const path = require('path');
const { cached } = require('../util/async');

const storageFileName = 'data.json';
const storageFilePath = path.resolve(__dirname, '../', storageFileName);

/**
 * Read storage, retrieving the current value or an empty value if there is no value in storage.
 * This method does not create a file in storage if one does not already exist.
 * (if no write was going to take place anyways, this would be an unnecessary operation)
 * @type {function(): Promise<object>}
 */
const readStorage = cached(async () => {
    try {
        const fileContents = await fs.readFile(storageFilePath, 'utf-8');
        return JSON.parse(fileContents);
    } catch (e) {
        if (e instanceof Error && e.code === 'ENOENT') {
            console.warn(`Warning: Storage ${storageFileName} file did not exist, a new one will be created on the next write...`);
            console.warn('    If this is not your first time running the bot, you will need to restore the old file and restart in order to avoid losing data');
            return {};
        } else {
            // rethrow all other exceptions
            throw e;
        }
    }
});

/**
 * Write the current in-memory value of storage into storage. This will also create an empty file if none exists yet.
 * @returns {Promise<void>}
 */
const writeStorage = async () => {
    const storageData = await readStorage();
    const newStorageContents = JSON.stringify(storageData);
    await fs.writeFile(storageFilePath, newStorageContents);
}

exports.readStorage = readStorage;
exports.writeStorage = writeStorage;