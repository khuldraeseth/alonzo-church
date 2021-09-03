const fs = require('fs');
const Discord = require('discord.js');
const conversation = require('./util/conversation');
const { prefix, token } = require('./cfg.json');

/**
 * @type {Discord.Client & { commands: Discord.Collection }}
 */
const client = Object.assign(new Discord.Client(), {
    commands: new Discord.Collection()
});

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js') && !file.endsWith('.map.js'));

for (const file of commandFiles) {
    if (!file.endsWith('.js')) {
        continue;
    }
    const command = require(`./commands/${file}`);

    if (!command || !command.execute) {
        continue;
    }

    client.commands.set(command.name, command);
}


client.once('ready', () => {
    console.log("Online.");
});

/**
 *
 * @param {Discord.Message} msg
 * @returns {Promise<*>}
 */
const handleMessage = async (msg) => {
    if (msg.content.startsWith(prefix)) {
        const argv = msg.content.slice(prefix.length).trim().split(' ');
        const commandName = argv.shift().toLowerCase();

        if (!commandName) {
            return conversation.failure(msg, 'Please provide a command!', false);
        }

        if (!client.commands.has(commandName)) {
            return conversation.failure(msg, `I don't know how to do that! (Unrecognized command)`, false);
        }

        try {
            await client.commands.get(commandName).execute(msg, argv);
        } catch (err) {
            console.error(`Error while handling command '${commandName}'`, err);
            return conversation.failure(msg, `Unable to execute command ):`);
        }
    }
}

client.on('message', msg => {
    handleMessage(msg)
        .catch(err => console.error('Error while handling message:', err))
});

client.login(token)
    .catch(err => console.error('Could not log into discord:', err));
