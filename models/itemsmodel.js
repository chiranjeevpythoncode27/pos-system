const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  price: {
    type: Number,
    required: true,
  },

  category: {
    type: String,
    required: true,
  },

  weight: {
    type: String,
    default: "",
  },

  // ✅ store image URL here
  image: {
    type: String,
    default: "",
  },
}, { timestamps: true });

module.exports = mongoose.model("Item", itemSchema);