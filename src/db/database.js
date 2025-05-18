const mongoose = require("mongoose");

const databaseConnection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB_URL);
    console.log("Mongo DB database connected Successfull");
  } catch (error) {
    console.log("Sever connection is Failed");
  }
};

module.exports = databaseConnection;
