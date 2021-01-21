const Discord = require('discord.js');

const classManagement = require('../api/class-management');

module.exports = {
    name: 'roles',
    description: 'get a list of all available roles',
    async execute(msg, argv) {
        const managedClasses = await classManagement.retrieveManagedClasses();

        const roles = managedClasses.map(managedClass => `${managedClass.department.toUpperCase()} ${managedClass.courseId.toUpperCase()}`)
            .sort()
            .join(" ​ ​ ​ ");

        const embed = new Discord.MessageEmbed()
            .setColor("#000000")
            .addField("Available Roles", roles);

        return msg.channel.send(embed);
    },
};
