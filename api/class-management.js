const storage = require('./storage');
const { typeName } = require('../util/types');
const { hasProperty, shallowEquals } = require('../util/object');
const { Mutex } = require('async-mutex');

const storagePropertyName = 'managedClasses';
const targetChannelParentName = 'course-specific';

const roleNameRegex = /^([A-Z]+) (\d+)$/;
const channelNameRegex = /^([a-z]+)-(\d+)$/;

/**
 * @typedef ManagedClass
 * @property {string} department
 * @property {string} courseId
 */

/**
 *
 * @param {ManagedClass} managedClass
 * @returns {string}
 */
const getTargetChannelName = ({ department, courseId }) => `${department.toLowerCase()}-${courseId.toLowerCase()}`;

/**
 * @param {ManagedClass} managedClass
 * @returns {string}
 */
const getTargetRoleName = ({ department, courseId }) => `${department.toUpperCase()} ${courseId.toUpperCase()}`;

/**
 * @param {string} channelName
 * @returns {ManagedClass}
 */
const fromChannelName = (channelName) => {
    const matchResult = channelName.match(channelNameRegex);
    if (!matchResult) {
        throw new RangeError(`Channel name ${channelName} does not look like a class.`);
    }
    const [, department, courseId] = matchResult;
    return { department, courseId };
};

/**
 * @type {ManagedClass[] | undefined}
 */
let managedClassesCache;
const managedClassLock = new Mutex();

/**
 * @type {function(): Promise<ManagedClass[]>}
 */
const retrieveManagedClasses = async () => {
    const release = await managedClassLock.acquire();

    try {
        if (!managedClassesCache) {
            const storageData = await storage.readStorage();

            if (!hasProperty(storageData, storagePropertyName)) {
                storageData[storagePropertyName] = [];
            }

            const classData = storageData[storagePropertyName];
            if (!Array.isArray(classData)) {
                throw new Error(`Class data should be an array, got ${typeName(classData)}`);
            }

            managedClassesCache = [];
            for (const data of classData) {
                if (!Array.isArray(data)) {
                    throw new Error(`Invalid class data; Expected array, got ${typeName(data)}`);
                }

                if (data.length !== 2) {
                    throw new Error(`Invalid class data; Expected 2 elements (department/id), got ${data.length} / ${data.toString()}`);
                }

                const [department, courseId] = data;

                managedClassesCache.push({
                    department,
                    courseId
                });
            }
        }
    } finally {
        release();
    }

    return managedClassesCache;
};

const saveManagedClasses = async () => {
    if (!managedClassesCache) {
        return;
    }

    const storageData = await storage.readStorage();
    storageData[storagePropertyName] = managedClassesCache.map(({ department, courseId }) => [department, courseId]);
    await storage.writeStorage();
};

const addManagedClasses = async (...newClasses) => {
    if (newClasses.length === 0) {
        return;
    }

    const managedClasses = await retrieveManagedClasses();
    managedClasses.push(...newClasses);
    await saveManagedClasses();
};

const removeManagedClass = async (...oldClasses) => {
    if (oldClasses.length === 0) {
        return;
    }

    const managedClasses = await retrieveManagedClasses();
    for (let i = 0; i < managedClasses.length; i++) {
        for (let j = 0; j < oldClasses.length; j++) {
            if (shallowEquals(managedClasses[i], oldClasses[j])) {
                oldClasses.splice(j, 1);
                managedClasses.splice(i, 1);

                if (oldClasses.length === 0) {
                    await saveManagedClasses();
                    return;
                }
            }
        }
    }
};


/**
 * @param {module:"discord.js".Guild} guild
 * @returns {Promise<ManagedClass[]>}
 */
const retrieveAllMissingRoles = async (guild) => {
    const managedClasses = await retrieveManagedClasses();
    const allRoleNames = new Set(guild.roles.cache.map(role => role.name));
    return managedClasses.filter((managedClass) => !allRoleNames.has(getTargetRoleName(managedClass)));
};

/**
 * @param {module:"discord.js".Guild} guild
 * @returns {Promise<ManagedClass[]>}
 */
const retrieveAllMissingChannels = async (guild) => {
    const managedClasses = await retrieveManagedClasses();
    const allChannelNames = new Set(guild.channels.cache.map(channel => channel.name));
    return managedClasses.filter((managedClass) => !allChannelNames.has(getTargetChannelName(managedClass)));
};

/**
 * @param {module:"discord.js".Guild} guild
 * @returns {Promise<ManagedClass[]>}
 */
const retrievePossibleNewManagedClasses = async (guild) => {
    const managedClasses = await retrieveManagedClasses();
    const expectedManagedChannelNames = new Set(managedClasses.map(getTargetChannelName));

    const allChannelNames = guild.channels.cache.map(channel => channel.name);
    const possibleClassChannelNames = allChannelNames.filter(channelName => channelNameRegex.test(channelName) && !expectedManagedChannelNames.has(channelName));

    return possibleClassChannelNames.map(fromChannelName);
};

/**
 *
 * @param {ManagedClass} a
 * @param {ManagedClass} b
 */
const compareClasses = (a, b) => {
    if (a.department === b.department) {
        return a.courseId.localeCompare(b.courseId);
    }
    return a.department.localeCompare(b.department);
};

/**
 *
 * @param {string} name
 * @param {RegExp} regex
 * @returns {ManagedClass}
 */
const nameToClass = (name, regex) => {
    const [, department, courseId] = name.match(regex);
    return { department, courseId };
};

/**
 * Display for users, e.g. a list of classes in chat. For now this is the exact same as the role name, could change
 * in the future which is why it's not just a direct alias and why it exists at all.
 * @param {ManagedClass} managedClass
 */
const display = (managedClass) => getTargetRoleName(managedClass);

/**
 * @template T
 * @param {ManagedClass} managedClass
 * @param {Array<T & {name: string}>} items
 * @param {RegExp} regex
 * @returns {T}
 */
// todo: fix this. discord's channel positions are really weird so I don't feel like fixing this RN
const getTargetPosition = (managedClass, items, regex) => {
    const availableItems = items.filter(item => regex.test(item.name))
        .sort((a, b) => a.name.localeCompare(b.name));

    let targetPosition = availableItems[0];
    for (let i = 1; i < availableItems.length; i++) {
        const currentClass = nameToClass(availableItems[i].name, regex);
        if (compareClasses(managedClass, currentClass) === -1) {
            break;
        }
        targetPosition = availableItems[i];
    }
    return targetPosition;
};

/**
 *
 * @param {module:"discord.js".Guild} guild
 * @returns {Generator<module:"discord.js".GuildChannel>}
 */
const getChannelsWithTargetParent = function* (guild) {
    for (const channel of guild.channels.cache.values()) {
        if (channel.parent && channel.parent.name === targetChannelParentName) {
            yield channel;
        }
    }
};

/**
 *
 * @param {module:"discord.js".Guild} guild
 * @param {ManagedClass} managedClass
 * @returns {Promise<module:"discord.js".Role>}
 */
const createRole = async (guild, managedClass) => {
    const targetRoleName = getTargetRoleName(managedClass);

    const targetRole = getTargetPosition(managedClass, [...guild.roles.cache.values()], roleNameRegex);

    return guild.roles.create({
        data: {
            name: targetRoleName,
            position: targetRole && targetRole.position
        },
        reason: 'Managed class'
    });
};

/**
 *
 * @param {module:"discord.js".Guild} guild
 * @param {ManagedClass} managedClass
 * @returns {Promise<module:"discord.js".Channel>}
 */
const createChannel = async (guild, managedClass) => {
    const targetChannelName = getTargetChannelName(managedClass);
    const targetParent = guild.channels.cache.find(channel => channel.name === targetChannelParentName);
    return guild.channels.create(targetChannelName, {
        parent: targetParent,
        reason: 'Managed class'
    });

};

const createMissingRoles = async (guild) => {
    const missingRoleClasses = await retrieveAllMissingRoles(guild);
    for (const managedClass of missingRoleClasses) {
        await createRole(guild, managedClass);
    }
};

const createMissingChannels = async (guild) => {
    const missingChannelClasses = await retrieveAllMissingChannels(guild);

    // In order to avoid race conditions with channel creation events, cache all channels before and populate with the
    // channels we know that we just created.
    const allTargetChannels = [...getChannelsWithTargetParent(guild)];
    const createdChannels = [];

    for (const managedClass of missingChannelClasses) {
        createdChannels.push(await createChannel(guild, managedClass));
    }

    allTargetChannels.push(...createdChannels);

    if (allTargetChannels.length) {
        const expectedChannelOrder = allTargetChannels.sort((a, b) => a.name.localeCompare(b.name));
        for (let i = 0; i < expectedChannelOrder.length; i++) {
            if (expectedChannelOrder[i].position !== i) {
                await expectedChannelOrder[i].setPosition(i);
            }
        }
    }
};

/**
 * @param {module:"discord.js".Guild} guild
 * @returns {Promise<void>}
 */
const updateState = async (guild) => {
    await Promise.all([
        createMissingRoles(guild),
        createMissingChannels(guild)
    ]);
};

/**
 * Haskell is used because it's the first language in the list I went down which had highlighting for both the department and course id.
 */
const displayLanguage = 'haskell';

exports.retrieveManagedClasses = retrieveManagedClasses;
exports.retrievePossibleNewManagedClasses = retrievePossibleNewManagedClasses;
exports.addManagedClasses = addManagedClasses;
exports.updateState = updateState;
exports.display = display;
exports.displayLanguage = displayLanguage;