const Discord = require('discord.js');

module.exports = {
    name: 'roles',
    description: 'get a list of all available roles',
    execute(msg, argv) {
        const myRole = msg.guild.roles.cache.find(x => x.name === "Alonzo Church");
        const roles = msg.guild.roles.cache
            .filter(x => !x.managed)
            .filter(x => x.comparePositionTo(myRole) < 0)
            .filter(x => x.name !== "@everyone")
            .map(x => x.name)
            .sort()
            .join(" ​ ​ ​ ");

        const embed = new Discord.MessageEmbed()
            .setColor("#000000")
            .addField("Available Roles", roles);

        return msg.channel.send(embed);
    },
};
