const Student = require("../../models/student");
const BasicInfo = require("../../models/basicinfo");
const ContactInfo = require("../../models/contactinfo");
const Fees = require("../../models/fees");
const Academic = require("../../models/academic");
const Classes = require("../../models/classes");
const FeesReceipt = require("../../models/feesReceipt");
const { generateReceiptFunction } = require("../receipt/receipt.controller");

//---------------------------------------------------------
//--------------- PENDING STUDENTS FEES -------------------
//---------------------------------------------------------

async function getAllPendingStudentsFees(req, res, next) {
  try {
    const is_primary = req.params.is_primary;
    let pending_students = await Academic.find()
      .populate({
        path: "student_id",
        select: "-_id student_id",
        populate: [
          { path: "basic_info_id", select: "full_name -_id" },
          { path: "contact_info_id", select: "whatsapp_no address -_id" },
        ],
      })
      .populate({
        path: "class_id",
        select:
          "-_id class_name medium stream batch_start_year is_active",
        match: {
          is_active: 1,
          is_primary: is_primary == 1 ? 1 : 0,
        },
      })
      .populate({
        path: "fees_id",
        select: "-_id -date -__v",
        match: {
          pending_amount: { $gt: 0 },
        },
      });

    pending_students = pending_students.filter((student) => {
      return student.fees_id != null && student.class_id != null;
    });

    if (!pending_students[0]) {
      return res.status(200).json({
        success: false,
        message: "No students with pending fees",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        pending_students,
      },
    });
  } catch (error) {
    next(error);
  }
}

// //---------------------------------------------------------
// //--------------- PARTICULAR STUDENT FEES DETAILS --------------------
// //---------------------------------------------------------

// async function getStudentFeesDetails(req, res, next) {
//   try{
//     const student_id = req.params.student_id;

//     const student_details = await Student.findOne({student_id});

//     let pending_students = await Academic.findOne({student_id: student_details._id})
//     .populate({
//       path: 'student_id',
//       select: '-_id student_id',
//       populate:[
//         {path: 'basic_info_id', select: 'full_name -_id'},
//         {path: 'contact_info_id', select: 'whatsapp_no address -_id'}
//       ]
//     })
//     .populate({
//       path: 'class_id',
//       select: '-_id class_name medium stream batch_start_year is_active',
//       match:{
//         is_active : 1
//       }
//     })
//     .populate({
//       path: 'fees_id',
//       select: '-_id -date -__v',
//       match:{
//         pending_amount: { $gt: 0}
//       }
//     });

//     pending_students = pending_students.filter((student)=>{
//       return student.fees_id != null && student.class_id != null;
//     })

//     if(!pending_students[0]){
// }     throw new Error('No students with pending fees');
//     }

//     res.status(200).json({
//       success: true,
//       data:{
//         pending_students
//       } ,
//     });

//   } catch(error){
//     next(error);
//   }
// }

//---------------------------------------------------------
//------- PARTICULAR STUDENTS ALL ACADEMIC DETAILS --------
//---------------------------------------------------------
async function studentAllAcademicDetails(req, res, next) {
  try {
    const student_id = req.params.student_id;

    const student_details = await Student.findOne({ student_id });

    const academic_details = await Academic.find({
      student_id: student_details._id,
    })
      .populate({
        path: "class_id",
      })
      .populate({
        path: "fees_id",
      })
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      academic_details,
    });
  } catch (error) {
    next(error);
  }
}

//---------------------------------------------------------
//------------ TRANSFER FEES TO ANOTHER STUDENT -----------
//---------------------------------------------------------

async function transferFeesToStudent(req, res, next) {
  try {
    const { payer_fees_id, payee_id, amount, admin_id, security_pin, payeeIsPrimary, NoOfMonths, last_paid, payer_last_paid, payer_net_fees, payer_batch_duration } =
      req.body;
    const is_by_cash = 1;
    const is_by_cheque = 0;
    const is_by_upi = 0;
    const cheque_no = -1;
    const upi_no = "-1";
    const discount = 0;
    const cheque_date = '';
    let total_months = 0;

    if(payeeIsPrimary){
      total_months = NoOfMonths;
    }

    //---------generating Student Receipt--------
    const result = await generateReceiptFunction(
      {
        student_id: payee_id,
        is_by_cash,
        is_by_cheque,
        is_by_upi,
        amount,
        discount,
        cheque_no,
        cheque_date,
        upi_no,
        admin_id,
        last_paid,
        total_months,
        security_pin,
        date: new Date()
      }
    );
    

    if (result == false) {
      return res.status(200).json({
        success: false,
        message: "Incorrect security pin",
      });
    }
    if(result.error){
      return res.status(500).json({
        success: false,
        message: result.error.message,
      });
    }

    //-------Deduct amount from payers fees-----
    let oldPaidUptoDate = new Date(`${payer_last_paid.split(" ")[0]}-1-${payer_last_paid.split(" ")[1]}`);

    const payers_months = 
            amount/Math.floor((payer_net_fees/payer_batch_duration)) > 1
            ?
              Math.ceil(amount/Math.floor((payer_net_fees/payer_batch_duration)) > 1)
            :
              Math.floor(amount/Math.floor((payer_net_fees/payer_batch_duration)) > 1)

    oldPaidUptoDate.setMonth(oldPaidUptoDate.getMonth() - payers_months);

    const fees_details = await Fees.findByIdAndUpdate(
      payer_fees_id,
      {
        $inc: { pending_amount: amount },
        paid_upto: `${oldPaidUptoDate.getMonth() + 1} ${oldPaidUptoDate.getFullYear()}`
      },
      { returnOriginal: false, new: true }
    );
    
    //If all fees is transfered then paid_upto will be -1
    if(fees_details.net_fees == fees_details.pending_amount){
      await Fees.findByIdAndUpdate(
        payer_fees_id,
        {
          paid_upto: "-1"
        },
        { returnOriginal: false, new: true }
      );
    }

    res.status(200).json({
      success: true,
      message: "Fees successfully transferred",
      fees_details,
    });
  } catch (error) {
    next(error);
  }
}

//---------------------------------------------------------
//--------------- STUDENT FEES HISTORY --------------------
//---------------------------------------------------------

async function studentFeesHistory(req, res, next) {
  try {
    const academic_id = req.params.academic_id;

    const academic_details = await Academic.findById(academic_id);

    const fees_details = await Fees.findById(academic_details.fees_id);

    const all_receipts = await FeesReceipt.find({ fees_id: fees_details._id, is_deleted: 0 })
      .populate("admin_id")
      .populate("transaction_id")
      .sort({date: -1, fees_receipt_id: -1});

    res.status(200).json({
      success: true,
      all_receipts,
    });
  } catch (error) {
    next(error);
  }
} //Pending

module.exports = {
  getAllPendingStudentsFees,
  // getStudentFeesDetails,
  studentFeesHistory,
  studentAllAcademicDetails,
  transferFeesToStudent,
};
