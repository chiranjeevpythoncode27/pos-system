const mongoose = require("mongoose")
const dotenv = require("dotenv")
const connectDb = require("./config/config")
const ItemModel = require("./models/itemsmodel")
const items = require("./utils/data")
require("colors")

dotenv.config();
connectDb();

const importData = async () => {
  try {
    await ItemModel.deleteMany();
    const itemData = await ItemModel.insertMany(items);
    console.log("All items added".bgGreen);
    process.exit();
  } catch (error) {
    console.log(`${error}`.bgRed.inverse);
    process.exit(1);
  }
};

importData();
