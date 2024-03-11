const { model, Schema } = require('mongoose');

const riddleSchema = new Schema(
    {
        title1: {
            type: String,
            required: true
        },
        title2: {
            type: String,
            required: false
        },
        title3: {
            type: String,
            required: false
        },
        title4: {
            type: String,
            required: false
        },
        category: {
            type: String,
            required: true,
        },
        answer: {
            type: String,
            required: true,
        },
        explanation: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        }
    }
);

const Riddle = model('riddle', riddleSchema);
module.exports = Riddle;
