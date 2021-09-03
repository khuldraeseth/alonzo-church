const conversation = require('../util/conversation');
const classManagement = require('../api/class-management');

module.exports = {
    name: 'update-classes',
    description: 'Manually updates state of all managed class channels/roles',
    isAdmin: true,
    async execute(msg, argv) {
        await classManagement.updateState(msg.guild);
        try {
            await conversation.success(msg);
        } catch (_) {

        }
    }
};