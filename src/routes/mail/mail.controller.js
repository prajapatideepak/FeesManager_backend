const FeesSender = require("./feesConfrim");
const PendingSender = require("./pendingFees");
const EmailSender = require("./studentMail");

async function httpRegisterMail(req, res) {
  const data = req.body;
  if (!data.email || !data.full_name) {
    return res.status(400).json({ error: "please Provide All details" });
  }
  try {
    //   const { fullName, email, phone, message } = req.body;
    const { email, full_name, studentID } = req.body;
    EmailSender({ email, full_name, studentID });
    res.status(200).json({ msg: "Your message sent successfully" });
  } catch (error) {
    res.status(500).json(error.message);
  }
}

// for fees Payment
async function httpFeesConfirmMail(req, res) {
  const data = req.body;
  if (
    !data.email ||
    !data.full_name ||
    !data.amount ||
    !data.admin ||
    !data.date
  ) {
    return res.status(400).json({ error: "please Provide All details" });
  }
  try {
    const { email, full_name, amount, admin, studentID } = req.body;

    const data = await FeesSender({ email, full_name, amount, admin, studentID });
    return res.status(200).json({ msg: "Message sent successfully" });
  } catch (error) {
    return res.status(500).json(error.message);
  }
}

async function httpPendingFees(req, res) {
  const students = req.body;  
  try {
    students.map((student) => {
      const net_fees = student.academics[0].fees[0].net_fees
      const class_name = student.academics[0].class[0].class_name
      email = student.contact_info[0].email;
      full_name = student.basic_info[0].full_name;
      PendingSender({ email, full_name, studentID: student.student_id, net_fees, class_name});
    });

    return res.status(200).json({ success: true, msg: "Message sent successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, msg: error.message});
  }
}

module.exports = {
  httpRegisterMail,
  httpFeesConfirmMail,
  httpPendingFees,
};
