const classManagement = require('../api/class-management');
const conversation = require('../util/conversation');
const markdown = require('../util/markdown');

module.exports = {
    name: 'classes',
    description: 'list all classes the bot knows about',
    async execute(self, msg) {
        const managedClasses = await classManagement.retrieveManagedClasses();

        if (managedClasses.length === 0) {
            return msg.reply(`I don't know about any classes!`);
        }

        const allClasses = managedClasses.map(classManagement.display)
            .sort()
            .join(', ');

        await conversation.success(msg, {
            text: `I know about ${markdown.inlineCode(managedClasses.length)} class(es): \n${markdown.blockCode(allClasses, classManagement.displayLanguage)}`,
            selfDestruct: false
        });
    }
}