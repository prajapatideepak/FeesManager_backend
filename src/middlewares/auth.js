const { config } = require("dotenv");
const jwt = require("jsonwebtoken");
const { getAdminByUser } = require("../model/admin.model");
const {JWT_SIGN} = require('../../constant')

const JWTSign = JWT_SIGN;

async function createToken(userID) {
  try {
    const token = jwt.sign({ userID }, JWTSign);
    return token;
  } catch (error) {
    console.error(error);
  }
}

async function verifyToken(token) {
  const decodeUsername = await jwt.verify(token, JWTSign);
  return decodeUsername;
}
module.exports = { createToken, verifyToken };
