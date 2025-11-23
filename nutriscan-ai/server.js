import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the dist directory
app.use(express.static(join(__dirname, 'dist')));

// Handle client-side routing - return index.html for all routes
app.get('*', (req, res) => {
  try {
    const html = readFileSync(join(__dirname, 'dist', 'index.html'), 'utf-8');
    res.send(html);
  } catch (error) {
    res.status(500).send('Error loading the application');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

