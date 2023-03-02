const express = require("express");
const {registerStudent, getAllStudents, getStudentDetails, getStudentDetailsUniversal, updateStudentDetails, cancelStudentAdmission, transferStudentsToNewClass, deleteAndTransferStudentToNewClass, searchStudentInPrimarySecondary } = require("./student.controller");

const studentRouter = express.Router();

studentRouter.post("/register", registerStudent);

studentRouter.post("/", getAllStudents);

studentRouter.get("/details/:id_name_whatsapp/:is_primary", getStudentDetails);

studentRouter.get("/search/transfer-fees/:id_name_whatsapp", searchStudentInPrimarySecondary);

studentRouter.get("/details/universal/:id_name_whatsapp/:is_primary", getStudentDetailsUniversal);

studentRouter.put("/update/:student_id", updateStudentDetails);

studentRouter.get("/cancel-admission/:student_id", cancelStudentAdmission);

studentRouter.post("/transfer", transferStudentsToNewClass);

studentRouter.post("/delete-and-transfer", deleteAndTransferStudentToNewClass);

module.exports = studentRouter;
