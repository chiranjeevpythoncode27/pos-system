const ItemModel = require("../models/itemsmodel");


// ================= GET ALL ITEMS =================
const getItemController = async (req, res) => {
  try {
    const items = await ItemModel.find().sort({ createdAt: -1 });

    res.status(200).send({
      success: true,
      count: items.length,
      items,
    });

  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};



// ================= ADD ITEM =================
const addItemController = async (req, res) => {
  try {
    const { name, price, category, weight, image } = req.body;

    // ✅ validation
    if (!name || !price || !category) {
      return res.status(400).send({
        success: false,
        message: "Name, Price and Category are required",
      });
    }

    const newItem = new ItemModel({
      name,
      price,
      category,
      weight: weight || "",
      image: image || "", // ✅ image URL stored
    });

    await newItem.save();

    res.status(201).send({
      success: true,
      message: "Item Saved Successfully",
      item: newItem,
    });

  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error saving item",
      error: error.message,
    });
  }
};



// ================= UPDATE ITEM =================
const updateItemController = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, category, weight, image } = req.body;

    const updatedItem = await ItemModel.findByIdAndUpdate(
      id,
      {
        name,
        price,
        category,
        weight: weight || "",
        image: image || "", // ✅ update image URL
      },
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).send({
        success: false,
        message: "Item not found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Item updated successfully",
      item: updatedItem,
    });

  } catch (error) {
    console.error(error);
    res.status(400).send({
      success: false,
      message: "Error updating item",
      error: error.message,
    });
  }
};



// ================= DELETE ITEM =================
const deleteItemController = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedItem = await ItemModel.findByIdAndDelete(id);

    if (!deletedItem) {
      return res.status(404).send({
        success: false,
        message: "Item not found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Item deleted successfully",
      item: deletedItem,
    });

  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error deleting item",
      error: error.message,
    });
  }
};



module.exports = {
  getItemController,
  addItemController,
  updateItemController,
  deleteItemController,
};