module.exports = {
    name: 'ping',
    description: 'ping',
    execute(msg, argv) {
        msg.channel.send('pong');
    },
};
