const classManagement = require('../api/class-management');
const markdown = require('../util/markdown');
const conversations = require('../util/conversation');

module.exports = {
    name: 'ingest-classes',
    description: 'Attempts to find all classes that have not been registered',
    isAdmin: true,
    async execute(msg, argv) {
        const possibleNewManagedClasses = await classManagement.retrievePossibleNewManagedClasses(msg.guild);

        if (possibleNewManagedClasses.length === 0) {
            return conversations.success(msg, { text: 'Looks like I know about all managed classes!' });
        }

        const intermediateMessage = await msg.reply(`Looks like there might be ${markdown.inlineCode(possibleNewManagedClasses.length)} managed class(es) that I don't know about:
${markdown.blockCode(possibleNewManagedClasses.map(classManagement.display).sort().join(', '), classManagement.displayLanguage)}
Please say "confirm" to create these managed classes.`)

        const nextAuthorMessage = (possibleMessage) => possibleMessage.author.id === msg.author.id;
        const collectedMessages = await msg.channel.awaitMessages(nextAuthorMessage, {
            time: conversations.messageTimeoutInMs,
            max: 1
        });

        try {
            if (collectedMessages.size === 0) {
                return conversations.failure(msg, 'Did not receive any input before timeout, no classes were added.');
            }

            const confirmMessage = collectedMessages.first();
            await confirmMessage.delete();

            if (confirmMessage.content.toLowerCase() !== 'confirm') {
                return conversations.failure(msg, 'Operation has been cancelled. Please run the command again to restart.');
            }

            await classManagement.addManagedClasses(...possibleNewManagedClasses);
            await classManagement.updateState(msg.guild);

            await conversations.success(msg, `Successfully added ${markdown.inlineCode(possibleNewManagedClasses.length)} new class(es).`);
        } finally {
            await intermediateMessage.delete();
        }
    }
};
