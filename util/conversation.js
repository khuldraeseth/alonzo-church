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
};

const reply = (msg, text, selfDestruct = true) => selfDestruct ? selfDestructingReply(msg, text) : msg.reply(text);

const reactOptionalReply = ({ msg, text, emoji, selfDestruct }) => {
    const reactionPromise = msg.react(emoji);

    if (!text) {
        return reactionPromise;
    }

    return Promise.all([
        reply(msg, text, selfDestruct),
        reactionPromise
    ]);
};

const success = (msg, { text, selfDestruct = true } = {}) => reactOptionalReply({
    msg, selfDestruct, text,
    emoji: '✅'
});

const failure = async (msg, reason, selfDestruct = true) => reactOptionalReply({
    msg, selfDestruct,
    text: reason,
    emoji: '❌'
});

/// The message timeout for conversations, e.g. to be used in a message collector
const messageTimeoutInMs = 15 * 1000; // 15 seconds

exports.success = success;
exports.failure = failure;
exports.messageTimeoutInMs = messageTimeoutInMs;