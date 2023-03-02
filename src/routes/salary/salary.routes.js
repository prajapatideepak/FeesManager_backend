const express = require("express");
const {salaryFaculty,allSalary,getsalary,updateStaffReceipt,getFacultyhistory, deleteStaffReceipt} = require("../Salary/salary.controller");

const SalaryRouter = express.Router();


SalaryRouter.get("/", allSalary)

SalaryRouter.post("/create-reciept", salaryFaculty);

SalaryRouter.get("/Staffhistory/:id", getFacultyhistory);

SalaryRouter.get("/receipt/:salary_receipt_id", getsalary);

SalaryRouter.put("/update/:salary_receipt_id", updateStaffReceipt);

SalaryRouter.put("/delete/:salary_receipt_id", deleteStaffReceipt);



module.exports = SalaryRouter;
