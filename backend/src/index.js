const express = require('express');
const cors = require('cors');
const db = require('./db');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.use('/auth', require('./routes/auth'));
app.use('/entries', require('./routes/entries'));
app.use('/users', require('./routes/users'));
app.use('/notifications', require('./routes/notifications'));
app.use('/chat', require('./routes/chat'));
app.use('/todos', require('./routes/todos'));
app.use('/truths', require('./routes/truths'));
app.use('/diary', require('./routes/diary'));

app.get('/health', (_, res) => res.json({ status: 'ok', app: 'Same Here' }));

async function initDB(retries = 10) {
  for (let i = 0; i < retries; i++) {
    try {
      const schema = fs.readFileSync(path.join(__dirname, 'db/schema.sql'), 'utf8');
      await db.query(schema);
      console.log('DB schema ready');
      return;
    } catch (e) {
      console.log(`DB not ready, retrying in 3s... (${i + 1}/${retries})`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  throw new Error('Could not connect to DB after retries');
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  await initDB();
  console.log(`Same Here API running on :${PORT}`);
});
