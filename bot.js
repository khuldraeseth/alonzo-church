const fs = require('fs');
const Discord = require('discord.js');
const { prefix, token } = require('./cfg.json');

/**
 * @type {Discord.Client & { commands: Discord.Collection }}
 */
const client = Object.assign(new Discord.Client(), {
    commands: new Discord.Collection()
});

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js') && !file.endsWith('.map.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
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
            return msg.reply('Please provide a command!');
        }

        if (!client.commands.has(commandName)) {
            return msg.reply(`I don't know how to do that! (Unrecognized command)`);
        }

        try {
            await client.commands.get(commandName).execute(msg, argv);
        } catch (err) {
            console.error(`Error while handling command '${commandName}'`, err);
            return msg.reply(`Unable to execute command ):`);
        }
    }
}

client.on('message', msg => {
    handleMessage(msg)
        .catch(err => console.error('Error while handling message:', err))
});

client.login(token)
    .catch(err => console.error('Could not log into discord:', err));
