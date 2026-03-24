const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// Import controllers
const { 
  getItemController, 
  addItemController, 
  updateItemController, 
  deleteItemController 
} = require("../controllers/itemControler");

// ✅ MULTER CONFIG (IMAGE UPLOAD)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ================== ITEM ROUTES ==================

// ✅ GET ITEMS
router.get("/items", getItemController);

// ✅ ADD ITEM WITH IMAGE
router.post("/add-items", upload.single("image"), addItemController);

// ✅ UPDATE ITEM WITH IMAGE
router.put("/update-item/:id", upload.single("image"), updateItemController);

// ✅ DELETE ITEM
router.delete("/delete-item/:id", deleteItemController);



// ================== WHATSAPP ORDER ==================

router.post("/send-order-whatsapp", async (req, res) => {
  try {
    const { customerName, customerPhone, items, totalAmount, notes } = req.body;
    
    if (!customerName || !customerPhone || !items || items.length === 0) {
      return res.status(400).send({ 
        success: false, 
        message: "Please provide all required fields" 
      });
    }

    const orderId = 'ORD' + Date.now().toString().slice(-8);
    
    const whatsappMessage = generateWhatsAppMessage({
      orderId,
      customerName,
      customerPhone,
      items,
      totalAmount,
      notes
    });

    const storePhone = process.env.STORE_PHONE || "7060988418";
    
    const whatsappLink = `https://wa.me/${storePhone}?text=${encodeURIComponent(whatsappMessage)}`;

    res.status(200).send({
      success: true,
      message: "WhatsApp link generated successfully",
      whatsappLink,
      orderId
    });

  } catch (error) {
    console.error("Error generating WhatsApp message:", error);
    res.status(500).send({ 
      success: false, 
      message: "Error generating WhatsApp message", 
      error: error.message 
    });
  }
});



// ================== HELPER FUNCTION ==================

function generateWhatsAppMessage(order) {
  let message = `🛒 *NEW ORDER #${order.orderId}*\n\n`;
  message += `👤 *Customer:* ${order.customerName}\n`;
  message += `📱 *Phone:* ${order.customerPhone}\n`;
  message += `📅 *Time:* ${new Date().toLocaleString()}\n\n`;
  message += `📦 *ORDER DETAILS:*\n`;
  message += `━━━━━━━━━━━━━━━\n`;
  
  order.items.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    message += `${index + 1}. *${item.name}*\n`;
    message += `   ${item.quantity} x ₹${item.price} = ₹${itemTotal.toFixed(2)}\n`;
  });
  
  message += `━━━━━━━━━━━━━━━\n`;
  message += `💰 *TOTAL AMOUNT:* ₹${order.totalAmount.toFixed(2)}\n`;
  
  if (order.notes) {
    message += `\n📝 *Notes:* ${order.notes}`;
  }
  
  message += `\n\n✅ Please confirm this order.`;
  
  return message;
}

module.exports = router;