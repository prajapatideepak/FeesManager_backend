const mongoose = require("mongoose");
const {MONGODB_URL} = require('../../constant')

async function startDatabase(){
  mongoose
    .connect(MONGODB_URL)
    .then(() => {
      console.log("Connected to database");
      return true;
    })
    .catch((err) => {
      console.log("Something went wrong, can't connect to database");
      return false;
    });
}

module.exports = {startDatabase};
  
