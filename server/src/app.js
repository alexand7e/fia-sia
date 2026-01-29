const express = require('express');
const path = require('path');

const defaultPublicDir = path.join(__dirname, '..', '..', 'public');

function createApp({ publicDir = defaultPublicDir } = {}) {
    const app = express();

    app.get('/health', (_req, res) => {
        res.status(200).json({ status: 'ok' });
    });

    app.use(express.static(publicDir));

    return app;
}

module.exports = { createApp, defaultPublicDir };
