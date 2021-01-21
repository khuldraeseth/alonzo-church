const { pause } = require('./async');

/**
 *
 * @param {module:"discord.js".Message} msg
 * @param {string} text
 * @param {number} timeoutInMs
 * @returns {Promise<void>}
 */
const selfDestructingReply = async (msg, text, timeoutInMs = 4000) => {
    /**
     * @type {module:"discord.js".Message}
     */
    const sentMessage = await msg.reply(text);
    await pause(timeoutInMs);
    await sentMessage.delete();
}

const success = msg => msg.react('✅');

const failure = async (msg, reason, selfDestruct = true) => {
    await msg.react('❌');
    if (reason) {
        if (selfDestruct) {
            return selfDestructingReply(msg, reason);
        } else {
            return msg.reply(reason);
        }
    }
}

exports.success = success;
exports.failure = failure;