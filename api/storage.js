// Storing data in a JSON file instead of a real database is heavily discouraged,
// but it should be fine in this case since we're only tracking a single list that changes very infrequently.
// If that changes, migrate off of JSON as soon as possible.

const { promises: fs } = require('fs');
const path = require('path');
const { cached } = require('../util/async');

const storageFileName = 'data.json';
const storageFilePath = path.resolve(__dirname, '../', storageFileName);

const readStorage = cached(async () => {
    const fileContents = await fs.readFile(storageFilePath, 'utf-8');
    return JSON.parse(fileContents);
});

const writeStorage = async () => {
    const storageData = await readStorage();
    const newStorageContents = JSON.stringify(storageData);
    await fs.writeFile(storageFilePath, newStorageContents);
}

exports.readStorage = readStorage;
exports.writeStorage = writeStorage;