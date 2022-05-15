require('dotenv/config');

const fs = require('fs');
const Discord = require('discord.js');
const conversation = require('./util/conversation');

const { isAdmin } = require('./util/permissions');
const { prefix } = require('./cfg.json');

const { ianModule } = require('./modules/ian');

/**
 * @type {Discord.Client & { commands: Discord.Collection }}
 */
const client = Object.assign(new Discord.Client({ ws: { intents: [ 'GUILD_MEMBERS', Discord.Intents.NON_PRIVILEGED ] } }), {
    commands: new Discord.Collection()
});

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js') && !file.endsWith('.map.js'));

for (const file of commandFiles) {
    if (!file.endsWith('.js')) {
        continue;
    }
    const command = require(`./commands/${file}`);

    if (!command || !command.execute || typeof command.execute !== 'function') {
        continue;
    }

    client.commands.set(command.name, command);
}


client.once('ready', () => {
    console.log('Online.');
});

/**
 * @param {typeof client} self
 * @param {Discord.Message} msg
 * @returns {Promise<*>}
 */
const handleMessage = async (self, msg) => {
    if (msg.content.startsWith(prefix)) {
        const argv = msg.content.slice(prefix.length).trim().split(' ');
        const commandName = argv.shift().toLowerCase();

        if (!commandName) {
            return conversation.failure(msg, 'Please provide a command!', false);
        }

        if (!client.commands.has(commandName)) {
            return conversation.failure(msg, `I don't know how to do that! (Unrecognized command)`, false);
        }

        const command = await client.commands.get(commandName);

        if (command.isAdmin && !isAdmin(msg.member)) {
            return conversation.failure(msg, 'Sorry, but you do not have permission to run this command.');
        }

        try {
            await command.execute(self, msg, argv);
        } catch (err) {
            console.error(`Error while handling command '${commandName}'`, err);
            return conversation.failure(msg, `Unable to execute command ):`);
        }
    }
}

client.on('message', msg => {
    handleMessage(client, msg)
        .catch(err => console.error('Error while handling message:', err))
});

ianModule(client);

client.login(process.env.token)
    .catch(err => console.error('Could not log into discord:', err));