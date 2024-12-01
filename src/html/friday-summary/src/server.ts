import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port: number = parseInt(process.env.PORT || '3000', 10);

// Serve static files from the dist directory
app.use(express.static(join(__dirname, '../')));

// Route for the main page
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, '../index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 