/**
 *
 * @param {module:"discord.js".GuildMember} member
 */
const isAdmin = member => member.hasPermission('ADMINISTRATOR');

exports.isAdmin = isAdmin;