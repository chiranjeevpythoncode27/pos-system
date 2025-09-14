const express = require("express");
const router = express.Router();

// Import controllers
const { 
  getItemController, 
  addItemController, 
  updateItemController, 
  deleteItemController 
} = require("../controllers/itemControler");

// Routes
router.get("/items", getItemController);
router.post("/add-items", addItemController);
router.put("/update-item/:id", updateItemController); // Update route
router.delete("/delete-item/:id", deleteItemController); // Delete route

module.exports = router;