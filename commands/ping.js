module.exports = {
    name: 'ping',
    description: 'ping',
    execute(self, msg, argv) {
        console.log(msg);
        msg.channel.send('pong');
    },
};
