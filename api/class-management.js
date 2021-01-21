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
    return {department, courseId};
}

/**
 * @template T
 * @param {ManagedClass} managedClass
 * @param {Array<T & {name: string}>} items
 * @param {RegExp} regex
 * @returns {T}
 */
// todo: fix this. discord's channel positions are really weird so I don't feel like fixing this RN
const getTargetPosition = (managedClass, items, regex) => {
    return undefined;

    const availableItems = items.filter(item => regex.test(item.name))
        .sort((a, b) => a.name.localeCompare(b.name));

    let targetPosition;
    for (let i = 0; i < availableItems.length; i++) {
        // if (i < availableItems.length - 1) {
        //     const nextClass = nameToClass(availableItems[i + 1].name, regex);
        //     console.log('next class is', nextClass);
        //     if (managedClass.department.localeCompare(nextClass.department) === 1) {
        //         break;
        //     }
        // }
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

    const availableChannels = [...guild.channels.cache.values()].filter(channel => channel.parent && channel.parent.name === targetChannelParentName);
    const targetChannel = getTargetPosition(managedClass, availableChannels, channelNameRegex);

    return guild.channels.create(targetChannelName, {
        parent: targetChannel && targetChannel.parent,
        position: (targetChannel && targetChannel.calculatedPosition) || undefined,
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
    for (const managedClass of missingChannelClasses) {
        await createChannel(guild, managedClass);
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

exports.addManagedClasses = addManagedClasses;
exports.updateState = updateState;