const conversation = require('../util/conversation');
const { pause } = require('../util/async');

module.exports = {
    name: 'add-role',
    description: 'add role to user',
    async execute(self, msg, argv) {
        const roleName = argv.join(' ');
        const role = msg.guild.roles.cache.find(x => x.name.toLowerCase() === roleName.toLowerCase());

        if (!role) {
            return conversation.failure(msg, `That role doesn't exist!`);
        }

        try {
            await msg.member.roles.add(role);
        } catch (err) {
            return conversation.failure(msg, `I can't add that role to you!`);
        }

        try {
            await conversation.success(msg);
            await pause(4000);
            await msg.delete();
        } catch (_) {

        }
    }
};
