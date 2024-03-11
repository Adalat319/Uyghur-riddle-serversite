const express = require('express');
const mongoose = require('mongoose');
const manage = require('./Controller/manage');
const app = express();
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables from .env file
dotenv.config();

// Use CORS middleware
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Use the 'manage' router for routing
app.use('/', manage);

// Get the port from environment variables or use default 8000
const port = process.env.PORT || 8000;

// Define the MongoDB URI
const mongoURI = process.env.MONGODB_URI;

const connectDB = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoURI, { dbName: 'RiddleDB', useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

const final = async () => {
    await connectDB();
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

final();