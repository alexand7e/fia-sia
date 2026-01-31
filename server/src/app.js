require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');

const defaultPublicDir = path.join(__dirname, '..', '..', 'public');

function createApp({ publicDir = defaultPublicDir } = {}) {
    const app = express();

    // Middleware
    app.use(cors()); // Enable CORS for all routes
    app.use(express.json()); // Parse JSON bodies
    app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

    // API Routes
    app.use('/api', apiRoutes);

    // Health check
    app.get('/health', (_req, res) => {
        res.status(200).json({ status: 'ok' });
    });

    // Static files (must be last)
    app.use(express.static(publicDir));

    return app;
}

module.exports = { createApp, defaultPublicDir };

