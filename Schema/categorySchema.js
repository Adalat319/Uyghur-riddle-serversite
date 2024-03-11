const { model, Schema } = require('mongoose');

const categorySchema = new Schema(
    {
        categoryTitle: {
            type: String,
            required: true
        },
        image: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
    }
);


const Category = model('category', categorySchema);
module.exports = Category;