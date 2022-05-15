const { getVisibleName } = require('../util/users');
const { guildDisplay } = require('../util/debug');
const { pause } = require('../util/async');
const { getOrCreateRole } = require('../util/roles');

const targetName = 'Ian Barber';
const timeBetweenTagOperationsInMs = 1000;

const retrieveIanRole = (guild) => getOrCreateRole(guild, {
    name: targetName
} /*createRoleOptions*/, 'Ian Module - role did not exist' /*createReason*/);

const doesUserHaveRole = (member) => Boolean(member.roles.cache.find(role => role.name === targetName));
const isUserAllowedRole = (member) => getVisibleName(member) === targetName;

/**
 * @type {{add: string, none: string, remove: string}}
 */
const RoleActions = { add: 'add', remove: 'remove', none: 'none' };

/**
 * @param member
 * @return {'add'|'remove'|'none'}
 */
const getRoleActionForMember = (member) => {
    if (isUserAllowedRole(member) && !doesUserHaveRole(member)) {
        return RoleActions.add;
    } else if (!isUserAllowedRole(member) && doesUserHaveRole(member)) {
        return RoleActions.remove;
    }
    return RoleActions.none;
}

/**
 * @param oldUser
 * @param newUser
 * @return {Promise<void>}
 */
const handleGuildMemberUpdate = async (oldUser, newUser) => {
    // We only want to handle name updated.
    if (getVisibleName(oldUser) === getVisibleName(newUser)) {
        return;
    }

    const roleAction = getRoleActionForMember(newUser);

    if (roleAction === RoleActions.none) {
        return;
    }

    const role = await retrieveIanRole(newUser.guild);

    // roles.[add, remove]
    await newUser.roles[roleAction](role, targetName);
};

const handleReady = async (client) => {
    for (const guild of client.guilds.cache.values()) {
        if (!guild.available) {
            console.error('Guild', guildDisplay(guild), 'is not currently available.');
            continue;
        }

        const allMembers = await guild.members.fetch();

        let targetRole;

        for (const member of allMembers.values()) {
            const roleAction = getRoleActionForMember(member);

            if (roleAction === RoleActions.none) {
                continue;
            }

            if (!targetRole) {
                targetRole = await retrieveIanRole(guild);
            }

            member.roles[roleAction](targetRole, targetName);

            // There's probably some kind of ratelimit here, may as well try to avoid it.
            await pause(timeBetweenTagOperationsInMs);
        }
    }
};

/**
 * @param {module:"discord.js".Client} client
 */
exports.ianModule = client => {
    client.on('guildMemberUpdate', (oldUser, newUser) => {
        handleGuildMemberUpdate(oldUser, newUser)
            .catch(err => console.error('Could not handle guild member update:', err));
    });

    client.on('ready', () => {
        handleReady(client)
            .catch(err => console.error('Could not handle ready:', err));
    });
};