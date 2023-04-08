const Student = require("../../models/student");
const Fees = require("../../models/fees");
const Academic = require("../../models/academic");
const Admin = require("../../models/admin");
const FeesReceipt = require("../../models/feesReceipt");
const Staff = require("../../models/staff");
const SalaryReceipt = require("../../models/salaryReceipt");
const Transaction = require("../../models/transaction");
const Notification = require("../../models/notification");
const FeesSender = require('../mail/feesConfrim');

//-------------------------------------------------------------
//------------------ GENERATE STUDENT RECEIPT -----------------
//-------------------------------------------------------------
const generateReceiptFunction = async (
  {
    student_id,
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
    date
  }
) => {
  try{

    const admin_details = await Admin.findById(admin_id);

    const isMatch = admin_details.security_pin == security_pin;

    if(!isMatch) {
      return false;
    }
  
    const student_details = await Student.findOne({ student_id });
    
    const academic_details = await Academic.findOne({
      student_id: student_details._id,
      is_transferred: 0
    })
      .populate({
        path: "student_id",
        select: "-_id student_id",
        populate: [
          { path: "basic_info_id", select: "full_name -_id" },
          { path: "contact_info_id", select: "whatsapp_no address email -_id" },
        ],
      })
      .populate({
        path: "fees_id"
      })
      .populate({
        path: "class_id",
        select:
          "-_id class_name medium stream batch_start_year is_active is_primary",
      })
  
    const net_amount = amount - discount;
  
    const transaction_details = await Transaction.create({
      is_by_cash,
      is_by_cheque,
      is_by_upi,
      cheque_no: cheque_no != "" ? cheque_no : -1,
      cheque_date: cheque_date != "" ? cheque_date : '',
      upi_no: upi_no != "" ? upi_no : "",
      amount: net_amount,
    });
  
    const fees_receipts = await FeesReceipt.find();
    const salary_receipts = await SalaryReceipt.find();
    const fees_receipt_id = fees_receipts.length + salary_receipts.length + 1 + 1000;
    
    let fromMonth="0", toMonth="0";
    // let lastPaidYear = 0;

    
    // if(academic_details.class_id.is_primary){
    //   if(last_paid == '-1'){
    //     lastPaidYear = new Date(date).getFullYear()
    //   }
    //   else{
    //     lastPaidYear = Number(last_paid.split(" ")[1])
    //   }

    //   let lastPaid = Number(last_paid.split(" ")[0]);

    //   if(lastPaid == -1){
    //     lastPaid = new Date(academic_details.date).getMonth() + 1;
    //   }
    
    //   fromMonth = Number(last_paid.split(" ")[0]) == -1 // If first time payment
    //               ?
    //                 `${lastPaid}` + " " + `${lastPaidYear}`
    //               :
    //                 lastPaid == 12
    //                   ?
    //                     `1 ${lastPaidYear + 1}`
    //                   : 
    //                     `${lastPaid + 1}` + " " + `${lastPaidYear}`
  
    //   toMonth = Number(last_paid.split(" ")[0]) == -1 // If first time payment
    //             ?
    //               ( ( lastPaid + Number(total_months) ) - 1 ) % 12 == 0
    //               ?
    //                 `12 ${lastPaidYear}`
    //               :
    //                 ( ( lastPaid + Number(total_months) ) - 1 ) > 12
    //                 ?
    //                   `${( ( lastPaid + Number(total_months) ) - 1 ) % 12}` + " " + `${lastPaidYear + 1}`
    //                 :
    //                   `${( ( lastPaid + Number(total_months) ) - 1 ) % 12}` + " " + `${lastPaidYear}`
    //             :
    //               lastPaid == 12 // If last paid is upto 12 month
    //               ? 
    //                 `${(lastPaid + Number(total_months)) % 12}` + " " + `${lastPaidYear + 1}`
    //               : 
    //                 lastPaid + Number(total_months) > 12
    //                 ?
    //                   `${(lastPaid + Number(total_months)) % 12}` + " " + `${lastPaidYear + 1}`
    //                 :
    //                   (lastPaid + Number(total_months)) % 12 == 0
    //                   ?
    //                     `12 ${lastPaidYear}`
    //                   :
    //                     `${(lastPaid + Number(total_months)) % 12}` + " " + `${lastPaidYear}`
    // }
                      
    const fees_receipt_details = await FeesReceipt.create({
      fees_receipt_id,
      fees_id: academic_details.fees_id._id,
      admin_id: admin_details._id,
      transaction_id: transaction_details._id,
      from_month: fromMonth,
      to_month: toMonth,
      discount,
      date
    })

    //updating pending amount of student in fees table
    await Fees.findOneAndUpdate(
      { _id: academic_details.fees_id._id },
      { 
        $inc: { pending_amount: -amount } ,
        paid_upto: academic_details.class_id.is_primary ? toMonth : "-1"
      }
    );
    
    if(is_by_cheque){
      await Notification.create({
        receipt_id : fees_receipt_id,
        cheque_no,
        cheque_date,
        is_deposited: 0
      })
    }
  
    FeesSender({ 
      email : academic_details.student_id.contact_info_id.email, 
      full_name : academic_details.student_id.basic_info_id.full_name,
      amount : net_amount, 
      admin : admin_details.username,
      studentID: student_id,
      net_fees: academic_details.fees_id.net_fees,
      class_name: academic_details.class_id.class_name,
      date
    })
  
    return fees_receipt_details;
  } catch(error){
    return {error: error.message}
  }
};

async function generateStudentReceipt(req, res, next) {
  try {

    const fees_receipt_details = await generateReceiptFunction(req.body);

    if (fees_receipt_details == false) {
      return res.status(200).json({
        success: false,
        message: "*Incorrect security pin",
      });
    } 
    else if(fees_receipt_details.error){
      return res.status(200).json({
        success: false,
        message: fees_receipt_details.error,
      });
    }
    else {
      res.status(200).json({
        success: true,
        message: "Receipt generated successfully",
        data: {
          fees_receipt_details,
        },
      });
    }
  } catch (error) {
    next(error);
  }
}

//-------------------------------------------------------------
//-------------------- UPDATE STUDENT RECEIPT -------------------
//-------------------------------------------------------------
async function updateStudentReceipt(req, res, next) {
  try {
    const fees_receipt_id = req.params.fees_receipt_id;

    const {
      is_by_cash,
      is_by_cheque,
      is_by_upi,
      cheque_no,
      cheque_date,
      upi_no,
      amount,
      discount,
      security_pin,
      admin_id,
      last_paid,
      total_months,
      date
    } = req.body;

    const admin_details = await Admin.findById(admin_id);

    const isMatch = security_pin == admin_details.security_pin;

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Please enter valid PIN",
      });
    }

    const net_amount = amount - discount;

    const lastPaidYear = Number(last_paid.split(" ")[1])
    let lastPaid = Number(last_paid.split(" ")[0])

    let toMonth = lastPaid == 12 
                  ? 
                    total_months == 1
                    ?
                      `12 ${lastPaidYear}`
                    :
                      `${(lastPaid + (total_months - 1)) % 12}` + " " + `${lastPaidYear + 1}`
                  :  
                    total_months == 1
                    ?
                      `${lastPaid}` + " " + `${lastPaidYear}`
                    :
                      (lastPaid + (total_months - 1)) % 12 == 0
                      ?
                        `12 ${lastPaidYear}`
                      :
                        (lastPaid + (total_months - 1)) > 12
                        ?
                           `${(lastPaid + (total_months - 1)) % 12}` + " " + `${lastPaidYear + 1}`
                        :
                          `${(lastPaid + (total_months - 1)) % 12}` + " " + `${lastPaidYear}`
                        

    const receipt_details = await FeesReceipt.findOneAndUpdate(
      { fees_receipt_id },
      {
        admin_id: admin_details._id,
        discount,
        is_edited: 1,
        from_month: `${lastPaid}` + " " + `${lastPaidYear}`,
        to_month: toMonth,
        date: date,
      }
    );

    const old_transaction_details = await Transaction.findByIdAndUpdate(
      receipt_details.transaction_id,
      {
        is_by_cash,
        is_by_cheque,
        is_by_upi,
        cheque_no: cheque_no ? cheque_no : -1,
        cheque_date: cheque_date ? cheque_date : '',
        upi_no: upi_no ? upi_no : "",
        amount: net_amount,
        date
      }
    );

    //updating pending amount of student in fees table
    const old_discount = receipt_details.discount;
    const pending_amount = (old_transaction_details.amount + old_discount) - amount;

    await Fees.findOneAndUpdate(
      { _id: receipt_details.fees_id },
      { 
        $inc: { pending_amount: pending_amount },
        paid_upto : toMonth 
      }
    );

  if(old_transaction_details.is_by_cheque && is_by_cheque){
    //updating notification
    await Notification.findOneAndUpdate({
      receipt_id : fees_receipt_id,
    },{
      cheque_no,
      cheque_date,
      is_deposited: 0
    })
  }
  if(old_transaction_details.is_by_cheque && !is_by_cheque){
    await Notification.findOneAndDelete({ receipt_id : fees_receipt_id })
  }
  else if(is_by_cheque){
    await Notification.create({
      receipt_id : fees_receipt_id,
      cheque_no,
      cheque_date,
      is_deposited: 0
    })
  }
  

    res.status(200).json({
      success: true,
      message: "Receipt Updated successfully",
    });
  } catch (error) {
    next(error);
  }
}

//-------------------------------------------------------------
//-------------------- DELETE STUDENT RECEIPT -------------------
//-------------------------------------------------------------
async function deleteStudentReceipt(req, res, next) {
  try {
    const fees_receipt_id = req.params.fees_receipt_id;

    const deletedReceipt = await FeesReceipt.findOneAndUpdate({ fees_receipt_id },{is_deleted: 1});

    //getting amount from transaction table
    const deletedTransaction = await Transaction.findById(deletedReceipt.transaction_id);
    const total_amount = deletedReceipt.discount + deletedTransaction.amount

    //updating fees table of student
    if(deletedReceipt.from_month != "0" && deletedReceipt.to_month != "0"){

      //Calculating month different between two dates
      const fromDate = new Date(`${deletedReceipt.from_month.split(" ")[0]}-1-${deletedReceipt.from_month.split(" ")[1]}`)
      const toDate = new Date(`${deletedReceipt.to_month.split(" ")[0]}-1-${deletedReceipt.to_month.split(" ")[1]}`)

      const _MS_PER_DAY = 1000 * 60 * 60 * 24;

      const utc1 = Date.UTC(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
          const utc2 = Date.UTC(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());

      const totalMonths = Math.round((Math.floor((utc2 - utc1) / _MS_PER_DAY))/30) + 1;
      //----------------------------------------------
      
      //Subtracting totalMonths from paid_upto date
      const oldFeesDetails = await Fees.findByIdAndUpdate(deletedReceipt.fees_id)
      const oldPaidUptoDate = new Date(`${oldFeesDetails.paid_upto.split(" ")[0]}-1-${oldFeesDetails.paid_upto.split(" ")[1]}`);
      let newPaidUptoDate = new Date(oldPaidUptoDate.setMonth(oldPaidUptoDate.getMonth() - totalMonths));
      //-------------------------------------------

      const fees_details = await Fees.findByIdAndUpdate(
        deletedReceipt.fees_id, 
        {
          $inc: {pending_amount: total_amount},
          paid_upto: `${newPaidUptoDate.getMonth() + 1} ${newPaidUptoDate.getFullYear()}`
        },
        {
          new: true
        }
      )

      if(fees_details.net_fees == fees_details.pending_amount){
        await Fees.findByIdAndUpdate(
          deletedReceipt.fees_id, 
          {
            paid_upto: "-1"
          }
        )
      }      
    }
    else{
      await Fees.findByIdAndUpdate(
        deletedReceipt.fees_id, 
        {
          $inc: {pending_amount: deletedTransaction.amount,
        }
      })
    }

    res.status(200).json({
      success: true,
      message: "Receipt Deleted successfully",
    });

  }catch (error) {
    next(error);
  }

}

//-----------------------------------------------------------------------------------
//------ SEARCH RECEIPT BY RECEIPT ID, STUDENT ID, STUDENT NAME, WHATSAPP NO --------
//-----------------------------------------------------------------------------------
async function searchReceipt(req, res, next) {
  try {
    let receipt_params = req.params.value;
    let is_primary = req.params.is_primary;
    let student_receipts = [];
    let staff_receipts = [];

    // Getting student details for student receipt
    let student_data = await Student.aggregate([
      {
        $lookup: {
          from: "basic_infos",
          localField: "basic_info_id",
          foreignField: "_id",
          as: "basic_info",
        },
      },
      {
        $lookup: {
          from: "contact_infos",
          localField: "contact_info_id",
          foreignField: "_id",
          as: "contact_info",
        },
      },
      {
        $lookup: {
          from: "academics",
          localField: "_id",
          foreignField: "student_id",
          as: "academics",
          let: { class_id: "class_id" },
          pipeline: [
            {
              $lookup: {
                from: "classes",
                localField: "class_id",
                foreignField: "_id",
                as: "class",
                pipeline: [
                  {
                    $match: {
                      is_primary: is_primary == 1 ? 1 : 0
                    },
                  },
                ],
              },
            },
            {
              $lookup: {
                from: "fees",
                localField: "fees_id",
                foreignField: "_id",
                as: "fees",
                pipeline: [
                  {
                    $lookup: {
                      from: "fees_receipts",
                      localField: "_id",
                      foreignField: "fees_id",
                      as: "fees_receipt",
                      pipeline: [
                        {
                          $lookup: {
                            from: "transactions",
                            localField: "transaction_id",
                            foreignField: "_id",
                            as: "transaction",
                          },
                        },
                        {
                          $lookup: {
                            from: "admins",
                            localField: "admin_id",
                            foreignField: "_id",
                            as: "admin",
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    ]);

    let flag = false;
    
    student_data.map(function (item) {
      const student_full_name = item?.basic_info[0]?.full_name?.toLowerCase();
      let isStudentNameFound = false;
      for(var i=0; i<item.academics?.length && item.academics[i].class?.length > 0; i++){
  
        if (isNaN(receipt_params)) {
          receipt_params = receipt_params.toLowerCase();
        } 
        
        if (student_full_name?.indexOf(receipt_params) > -1) {
          isStudentNameFound = true;
        }
        
        let receipt;
        let isReceipts = item?.academics[i]?.fees[0]?.fees_receipt?.length > 0

        if (!isNaN(receipt_params) && isReceipts) {
          //if whatsapp no match then push all receipts
          if(
            (item?.contact_info[0]?.whatsapp_no == receipt_params && isReceipts )
          ){
            student_receipts.push(item)
            break;
          }
          
          //if student id match then push all receipts
          if(
            (item.student_id == receipt_params && isReceipts )
          ){
            student_receipts.push(item)
            break;
          }

          //If above both condition fails then find particular receipt
          for(var k=0; k < item.academics[i].fees[0].fees_receipt?.length; k++){
            receipt = item.academics[i].fees[0].fees_receipt[k]
            if (receipt.fees_receipt_id == receipt_params && !receipt.is_deleted) {
              //keeping the found academics and removing others academics
              const academic = item.academics.splice(i, 1);
              item.academics = academic;

              //emptying all receipts
              item.academics[0].fees[0].fees_receipt = []
              //Adding receipt which is matched
              item.academics[0].fees[0].fees_receipt.push(receipt)
              student_receipts.push(item);
              flag = true;
              break;
            }
          }
        }
        else if (isStudentNameFound && isReceipts){ //If student name match, push all receipts
          student_receipts.push(item);
          break;
        }

        if(flag){
          break;
        }
      }
      
    });

    // Getting staff details for staff receipt
    let staff_data = await Staff.aggregate([
      {
        $lookup: {
          from: "basic_infos",
          localField: "basic_info_id",
          foreignField: "_id",
          as: "basic_info",
        },
      },
      {
        $lookup: {
          from: "contact_infos",
          localField: "contact_info_id",
          foreignField: "_id",
          as: "contact_info",
        },
      },
      {
        $lookup: {
          from: "salary_receipts",
          localField: "_id",
          foreignField: "staff_id",
          as: "salary_receipt",
          let: { class_id: "class_id" },
          pipeline: [
            {
              $lookup: {
                from: "transactions",
                localField: "transaction_id",
                foreignField: "_id",
                as: "transaction",
              },
            },
            {
              $lookup: {
                from: "admins",
                localField: "admin_id",
                foreignField: "_id",
                as: "admin",
              },
            },
            {
              $lookup: {
                from: "hourly_salarys",
                localField: "_id",
                foreignField: "salary_receipt_id",
                as: "hourly_salary",
              },
            },
            {
              $lookup: {
                from: "monthly_salarys",
                localField: "_id",
                foreignField: "salar_receipt_id",
                as: "monthly_salary",
              },
            },
          ],
        },
      },
    ]);

    staff_receipts = staff_data.filter(function (item) {
      const staff_full_name = item?.basic_info[0]?.full_name?.toLowerCase();
      let isStaffNameFound = false;

      if (isNaN(receipt_params)) {
        receipt_params = receipt_params.toLowerCase();
      }

      if (staff_full_name?.indexOf(receipt_params) > -1){
        isStaffNameFound = true;
      }

      let isReceiptFound = false

      //Finding receipts from receipt_id
      let receipts;
      if(item?.salary_receipt[0] && !isNaN(receipt_params)){
        receipts = item.salary_receipt.filter((item)=>{
          if(item.salary_receipt_id == receipt_params && !item.is_deleted){
              isReceiptFound = true;
              return item;
          }
        })
      }

      if(isReceiptFound){
        item.salary_receipt = receipts;
        return item
      }

      return isStaffNameFound || item?.contact_info[0]?.whatsapp_no == receipt_params;
    });
      

    if (staff_data?.length == 0 && student_data?.length == 0) {
      return res.status(200).json({
        success: false,
        message: "No Receipt found",
      });
    }

    res.status(200).json({
      status: true,
      student_receipts,
      staff_receipts,
    });
  
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generateStudentReceipt,
  updateStudentReceipt,
  deleteStudentReceipt,
  searchReceipt,
  generateReceiptFunction,
};
