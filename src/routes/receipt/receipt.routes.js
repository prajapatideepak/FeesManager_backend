const express = require("express");
const {generateStudentReceipt, updateStudentReceipt, searchReceipt, deleteStudentReceipt} = require('./receipt.controller');

receiptRouter = express.Router();

receiptRouter.post('/generate/student', generateStudentReceipt);
receiptRouter.put('/delete/student/:fees_receipt_id', deleteStudentReceipt);
receiptRouter.put('/update/student/:fees_receipt_id', updateStudentReceipt);
receiptRouter.get('/search/:value/:is_primary', searchReceipt);

module.exports = receiptRouter;
