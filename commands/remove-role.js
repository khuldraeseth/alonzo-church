const { AssertionError } = require("assert");

module.exports = {
    name: 'remove-role',
    description: 'remove role from user',
    execute(msg, argv) {
        const roleName = argv.join(" ");
        const role = msg.guild.roles.cache.find(x => x.name.toLowerCase() == roleName.toLowerCase());
        msg.member.roles.remove(role)
            .then (() => msg.react("✅"))
            .catch(() => msg.channel.send(`Role ${roleName} does not exist or is not self-assignable.`)
                             .then(m => m.delete({ timeout: 4000 }))
                             .catch()
            );

        msg.delete({ timeout: 4000 }).catch();
    },
};
