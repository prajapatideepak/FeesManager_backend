const express = require("express");
const {
  httpGetReport,
  httpGetSalaryReport,
  httpGetMonthlyReport,
} = require("./report.controller");

const reportRouter = express.Router();

reportRouter.get("/fees/:section", httpGetReport);
reportRouter.get("/salary", httpGetSalaryReport);
reportRouter.get("/month/:section", httpGetMonthlyReport);
module.exports = reportRouter;
