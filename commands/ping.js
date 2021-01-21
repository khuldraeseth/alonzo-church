module.exports = {
    name: 'ping',
    description: 'ping',
    execute(self, msg, argv) {
        msg.channel.send('pong');
    },
};
