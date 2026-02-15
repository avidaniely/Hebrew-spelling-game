import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory storage
const storage = new Map();

// Storage API endpoints
app.get('/api/storage/:key', (req, res) => {
  const { key } = req.params;
  const value = storage.get(key);
  
  if (value) {
    res.json({ key, value, shared: true });
  } else {
    res.status(404).json({ error: 'Key not found' });
  }
});

app.post('/api/storage/:key', (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  
  storage.set(key, value);
  res.json({ key, value, shared: true });
});

app.delete('/api/storage/:key', (req, res) => {
  const { key } = req.params;
  const deleted = storage.delete(key);
  
  res.json({ key, deleted, shared: true });
});

app.get('/api/storage', (req, res) => {
  const { prefix } = req.query;
  let keys = Array.from(storage.keys());
  
  if (prefix) {
    keys = keys.filter(k => k.startsWith(prefix));
  }
  
  res.json({ keys, prefix, shared: true });
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 Hebrew Vocab Game server running on port ${PORT}`);
  console.log(`🌐 Open http://localhost:${PORT} in your browser`);
});

// Cleanup old rooms every 30 minutes
setInterval(() => {
  const now = Date.now();
  const thirtyMinutes = 30 * 60 * 1000;
  
  for (const [key, value] of storage.entries()) {
    if (key.startsWith('room_')) {
      try {
        const state = JSON.parse(value);
        const lastUpdate = state.lastUpdate || 0;
        
        if (now - lastUpdate > thirtyMinutes) {
          storage.delete(key);
          console.log(`🗑️  Cleaned up inactive room: ${key}`);
        }
      } catch (e) {
        storage.delete(key);
      }
    }
  }
}, 30 * 60 * 1000);
