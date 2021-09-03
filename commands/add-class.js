const conversation = require('../util/conversation');
const classManagement = require('../api/class-management');

const alphabetRegex = /^[a-zA-Z]+$/;
const numbersRegex = /^\d+$/;

module.exports = {
    name: 'add-class',
    description: 'add a new class channel',
    isAdmin: true,
    async execute(msg, argv) {
        if (argv.length < 2) {
            return conversation.failure(msg, 'Expected input in the form of "DEPARTMENT COURSE_ID"');
        }

        const [department, courseId] = argv;

        if (!alphabetRegex.test(department)) {
            return conversation.failure(msg, 'Bad department, only letters are allowed');
        }

        if (!numbersRegex.test(courseId)) {
            return conversation.failure(msg, 'Bad course id, only numbers are allowed');
        }

        await classManagement.addManagedClasses({ department, courseId });
        await classManagement.updateState(msg.guild);

        try {
            await conversation.success(msg);
        } catch (_) {

        }
    }
};