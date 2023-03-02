
const mongoose = require("mongoose");

const branches = new mongoose.Schema({
    branch_name:{
        type: String,
        required: [true, 'Please enter class name'],
    },
    date: {
        type: Date,
        default: Date.now,
    },
})

module.exports = mongoose.model('branches', branches);