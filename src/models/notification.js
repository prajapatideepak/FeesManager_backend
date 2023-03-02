const mongoose = require("mongoose");

const notification = new mongoose.Schema({
    receipt_id:{
        type: Number,
        required: true
    },
    cheque_no: {
        type: String,
        required: true,
    },
    cheque_date: {
        type: Date,
        required: true,
    },
    is_deposited:{
        type: Number,
        default: 0,
    },
    date: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("notifications", notification);
