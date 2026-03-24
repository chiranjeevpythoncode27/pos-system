const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDb = require('./config/config'); // MongoDB connection
const path = require('path');
require('colors');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDb();

const app = express();

// ================= MIDDLEWARE =================

// Enable CORS
app.use(cors());

// Parse JSON
app.use(express.json());

// Logger
app.use(morgan('dev'));

// ✅ SERVE UPLOADED IMAGES (VERY IMPORTANT)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// ================= ROUTES =================

const itemRoutes = require("./routes/itemsroute");

// Use routes
app.use('/api', itemRoutes);


// ================= ROOT ROUTE =================

app.get('/', (req, res) => {
  res.send('API is running...');
});


// ================= SERVER =================

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Server Running on Port ${PORT}`.bgGreen.white);
});