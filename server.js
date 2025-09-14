const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDb = require('./config/config'); // MongoDB connection
require('colors');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDb();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
const itemRoutes = require("./routes/itemsroute");
app.use('/api/items', itemRoutes);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`Server Running on Port ${PORT}`.bgGreen.white);
});
