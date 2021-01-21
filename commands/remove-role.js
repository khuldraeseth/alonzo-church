const conversation = require('../util/conversation');
const { pause } = require('../util/async');

module.exports = {
    name: 'remove-role',
    description: 'remove role from user',
    async execute(self, msg, argv) {
        const roleName = argv.join(' ');
        const role = msg.guild.roles.cache.find(x => x.name.toLowerCase() === roleName.toLowerCase());

        if (!role) {
            return msg.reply(`That role doesn't exist!`);
        }

        try {
            await msg.member.roles.remove(role);
        } catch (e) {
            return conversation.failure(msg, `I can't remove that role from you!`);
        }

        try {
            await conversation.success(msg);
            await pause(4000);
            await msg.delete();
        } catch (_) {
        }

    }
};
