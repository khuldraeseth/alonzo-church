/**
 *
 * @param {module:"discord.js".Guild} guild
 * @param {string} roleName - Case-insensitive role name
 * @returns The role if it exists, otherwise undefined
 */
const getRoleIfExists = (guild, roleName) => guild.roles.cache.find(role => role.name.toLowerCase() === roleName.toLowerCase());

/**
 * @param {module:"discord.js".Guild} guild
 * @param {{ name: string }} createRoleOptions - Data to use to create the role
 * @param {string} createReason - Reason to use if the role needs to be created.
 */
const getOrCreateRole = async (guild, createRoleOptions, createReason) => {
    let role = getRoleIfExists(guild, createRoleOptions.name);

    if (!role) {
        role = await guild.roles.create({
            data: createRoleOptions,
            reason: createReason
        });
    }

    return role;
};

exports.getRoleIfExists = getRoleIfExists;
exports.getOrCreateRole = getOrCreateRole;
