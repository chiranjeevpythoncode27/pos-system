const mongoose = require("mongoose");
require("colors");

const connectDb = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`.bgYellow.black);
  } catch (error) {
    console.log(`Error: ${error.message}`.bgRed.white);
    process.exit(1);
  }
};

module.exports = connectDb;
