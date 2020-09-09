const fs = require('fs');
const Discord = require("discord.js");
const { prefix, token } = require("./cfg.json");

const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}


client.once("ready", () => {
    console.log("Online.");
});

client.on("message", msg => {
    if (msg.content.startsWith(prefix)) {
        const argv = msg.content.slice(prefix.length).trim().split(' ');
        const cmd = argv.shift().toLowerCase();

        try {
            client.commands.get(cmd).execute(msg, argv);
        } catch (err) {
            console.error(err);
            msg.channel.send('no');
        }
    }
});

client.login(token);
