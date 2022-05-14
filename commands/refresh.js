const fs = require('fs');
const path = require('path');
const Discord = require('discord.js');
const conversation = require('../util/conversation');
const { isAdmin } = require('../util/permissions');
const { pause } = require('../util/async');

module.exports = {
    name: 'refresh',
    description: 'refresh the list of available commands',
    async execute(self, msg, argv) {
        if (!isAdmin(msg.member)) {
            return conversation.failure(msg, 'Sorry, but you do not have permission to run this command.');
        }

        commands = new Discord.Collection();

        const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js') && !file.endsWith('.map.js'));
        for (const file of commandFiles) {
            // `require` caches modules. Need to delete this cache entry before requiring again.
            const absPath = path.resolve(`./commands/${file}`);
            delete require.cache[absPath];
            const command = require(absPath);

            commands.set(command.name, command);
        }

        self.commands = commands;

        try {
            await conversation.success(msg);
            await pause(4000);
            await msg.delete();
        } catch (_) {

        }
    }
};
