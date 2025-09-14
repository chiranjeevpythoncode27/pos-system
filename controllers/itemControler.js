const ItemModel = require("../models/itemsmodel");

const getItemController = async (req, res) => {
  try {
    const items = await ItemModel.find();
    res.status(200).send(items);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Server Error", error });
  }
};

const addItemController = async (req, res) => {
  try {
    const newItem = new ItemModel(req.body);
    await newItem.save();
    res.status(201).send("Item Saved Successfully");
  } catch (error) {
    console.log(error);
    res.status(400).send({ message: "Error saving item", error });
  }
};

// Update Item Controller
const updateItemController = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedItem = await ItemModel.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedItem) {
      return res.status(404).send({ message: "Item not found" });
    }
    
    res.status(200).send({ 
      message: "Item updated successfully", 
      item: updatedItem 
    });
  } catch (error) {
    console.error(error);
    res.status(400).send({ message: "Error updating item", error });
  }
};

// Delete Item Controller
const deleteItemController = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedItem = await ItemModel.findByIdAndDelete(id);
    
    if (!deletedItem) {
      return res.status(404).send({ message: "Item not found" });
    }
    
    res.status(200).send({ 
      message: "Item deleted successfully", 
      item: deletedItem 
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Error deleting item", error });
  }
};

module.exports = { 
  getItemController, 
  addItemController, 
  updateItemController, 
  deleteItemController 
};