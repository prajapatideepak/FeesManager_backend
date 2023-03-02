const express = require("express");
const adminRouter = require("./routes/admin/admin.routes");
const facultyRouter = require("./routes/faculty/faculty.routes");
const SalaryRouter = require("./routes/Salary/salary.routes");
const feesRouter = require("./routes/fees/fees.routes");
const studentRouter = require("./routes/students/student.routes");
const receiptRouter = require("./routes/receipt/receipt.routes");
const reportRouter = require("./routes/report/report.route");
const classesRouter = require("./routes/classes/classes.routes");
const notificationRouter = require("./routes/notification/notification.routes");
const imagekitAuthRouter = require("./routes/imagekit/imagekit.routes");
const cors = require("cors");
const mailRouter = require("./routes/mail/mail.route");
const path = require("path");
domain = require('domain');

const app = express();
d = domain.create();
  
app.use(express.json());
app.use(cors());
app.use(express.static("public/images"));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "..", "client")));

app.use("/students", studentRouter,);
app.use("/fees", feesRouter);
app.use("/admin", adminRouter);
app.use("/classes", classesRouter);

app.use("/receipt", receiptRouter);
app.use("/report", reportRouter);

app.use("/faculty", facultyRouter);
app.use("/salary", SalaryRouter);
app.use("/imagekit", imagekitAuthRouter);

app.use("/mail", mailRouter);
app.use("/notifications", notificationRouter);


// app.get("/*", (req, res) => {
//   res.sendFile(path.join(__dirname, "..", "client", "index.html"));
// });

app.use((req, res, next) => {
  const err = new Error("Page Not Found");
  err.status = 404;
  next(err);
})

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({success: false, message: err.message});
})

app.use((err, req, res, next) => {
  process.on('uncaughtException', function(ex) {
    res.status(err.status || 500).json({success: false, message: 'Something went wrong'});
  });
})
app.use((err, req, res, next) => {
  d.on('error', function(err) {
    res.status(err.status || 500).json({success: false, message: err.message});
  });
})



module.exports = app;
