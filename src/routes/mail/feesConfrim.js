const nodemailer = require("nodemailer");
const {USER, PASSWORD} = require('../../../constant')

const Email = (options) => {
  let transpoter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,

    auth: {
      user: USER, // email
      pass: PASSWORD, //password
    },
  });
  transpoter.sendMail(options, (err, info) => {
    if (err) {
      return;
    }
  });
};
// send email
const FeesSender = ({ email, full_name, amount, admin, studentID, net_fees, class_name, date }) => {

  let receipDate = new Date(date)
  receipDate = `${receipDate.getDate() < 10 ? "0" + receipDate.getDate() : receipDate.getDate()}-${receipDate.getMonth() + 1 < 10 ? "0" + (receipDate.getMonth() + 1) : receipDate.getMonth() + 1}-${receipDate.getFullYear()}`;

  const options = {
    from: `Nasir Sir Classes 👨‍🏫 <${USER}>`,
    to: `${email}`,
    subject: "Thank you for your payment",
    html: `
        <div style="width: 100%; background-color: #f3f9ff; padding: 5rem 0">
        <div style="max-width: 700px; background-color: white; margin: 0 auto">
           <div style="width: 100%; background-color: #ADD8E6; padding: 20px 0">
          <a href="" ><img
              src="https://ik.imagekit.io/44qikvq89/logo.png?ik-sdk-version=javascript-1.4.3&updatedAt=1672646698450"
              style="width: 100%; height: 70px; object-fit: contain"
            /></a> 
          
          </div>
          <div style="width: 100%; gap: 10px; padding: 30px 0; display: grid">
            <p style="font-weight: 800; font-size: 1.2rem; padding: 0 30px">
                    Payment Successfull
            </p>
            <div style="font-size: .8rem; margin: 0 30px">
            <h3> Student ID: ${studentID} </h3>
            <h3> Class: ${class_name.toUpperCase()} </h3>
            <h3> Total Fees: ${net_fees} </h3>
            <h3> Hello, ${full_name.toUpperCase()} </h3>
            <p>Thank you for your tuition fees. We're glad to have you as a student at Nasir sir classes. We hope that this will be a great experience for you.</p>
            <p>Amount Paid <span style="font-weight: 600">Rs ${amount} </span> by ${admin}</p>
            <p>Date : ${receipDate} </p>
             <p style="font-weight:800">Thank You   </p>
              <p style="font-weight:800" >Team Nasir Sir</b></p>
            </div>
          </div>
        </div>
      </div>
        `,
  };
  Email(options);
};
module.exports = FeesSender;
