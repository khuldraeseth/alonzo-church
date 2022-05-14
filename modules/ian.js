const { guildDisplay } = require('../util/debug');
const { pause } = require('../util/async');

const targetName = 'Ian Barber';
const timeBetweenTagAddsMs = 1000;

const retrieveIanRole = (guild) => getOrCreateRole(guild, {
    name: targetName
} /*createRoleOptions*/, 'Ian Module - role did not exist' /*createReason*/);

/**
 * @param {module:"discord.js".Client} client
 */
exports.ianModule = client => {
    client.on('guildMemberUpdate', (oldUser, newUser) => {
        if (oldUser.nickname === newUser.nickname) {
            return;
        }

        if (newUser.nickname !== targetName) {
            return;
        }

        retrieveIanRole(newUser.guild)
            .then(role => newUser.roles.add(role))
            .catch(err => console.error('Could not retrieve/assign ian role:', err));
    });

    client.on('ready', () => {
        for (const guild of client.guilds.cache.values()) {
            if (!guild.available) {
                console.error('Guild', guildDisplay(guild), 'is not currently available.');
                continue;
            }

            guild.members.fetch()
                .then(async (allMembers) => {
                    const membersThatNeedRole = allMembers.filter(member => member.nickname === targetName && !member.roles.cache.find(role => role.name === targetName));

                    if (!membersThatNeedRole) {
                        return;
                    }

                    const targetRole = await retrieveIanRole(guild);

                    for (const member of membersThatNeedRole.values()) {
                        await member.roles.add(targetRole);

                        // There's probably a ratelimit, may as well try to avoid it.
                        // We only really expect this task to matter once anyways, the rest should be caught in realtime
                        await pause(timeBetweenTagAddsMs);
                    }
                })
                .catch(err => console.error('Guild', guildDisplay(guild), 'could not fetch all members or assign them ian role:', err));
        }
    });
};