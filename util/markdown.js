/**
 *
 * @param {string} contents
 * @param {string} [language]
 * @returns {string}
 */
const blockCode = (contents, language) => `\`\`\`${language || ''}
${contents}
\`\`\``;

const inlineCode = (contents) => `\`${contents}\``;

exports.blockCode = blockCode;
exports.inlineCode = inlineCode;