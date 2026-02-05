const path = require('path');
const { createApp, defaultPublicDir } = require('./app');

const port = Number.parseInt(process.env.PORT, 10) || 3003;
const publicDir = process.env.PUBLIC_DIR
    ? path.resolve(process.env.PUBLIC_DIR)
    : defaultPublicDir;

const app = createApp({ publicDir });

app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on http://localhost:${port}`);
});
