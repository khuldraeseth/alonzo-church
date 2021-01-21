const conversation = require('../util/conversation');
const { isAdmin } = require('../util/permissions');
const classManagement = require('../api/class-management');

module.exports = {
    name: 'update-classes',
    description: 'Manually updates state of all managed class channels/roles',
    async execute(self, msg, argv) {
        if (!isAdmin(msg.member)) {
            return conversation.failure(msg, 'You do not have permission to run this command.');
        }
        await classManagement.updateState(msg.guild);
        try {
            await conversation.success(msg);
        } catch (_) {

        }
    }
};