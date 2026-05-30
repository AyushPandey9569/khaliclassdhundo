const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const port = 3000;
const db = new sqlite3.Database('./database.sqlite');

app.use(cors());
app.use(express.json());

// GET all rooms or filter by block
app.get('/api/rooms', (req, res) => {
  const block = req.query.block;
  let query = "SELECT * FROM rooms";
  let params = [];

  if (block && block !== 'All') {
    query += " WHERE block = ?";
    params.push(block);
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// POST claim a room - INTENTIONAL RACE CONDITION BUG
app.post('/api/claim/:id', (req, res) => {
  const roomId = req.params.id;

  // NAIVE IMPLEMENTATION:
  // 1. Read the current status
  db.get("SELECT status FROM rooms WHERE id = ?", [roomId], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res.status(404).json({ error: "Room not found" });
    }

    console.log(`Checking status for room ${roomId}: ${row.status}`);

    // 2. Check in JS (NOT ATOMIC)
    if (row.status === 'empty') {
      // Simulate a small delay to make the race condition easier to trigger
      setTimeout(() => {
        // 3. Update the row
        db.run("UPDATE rooms SET status = 'claimed' WHERE id = ?", [roomId], function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          console.log(`Room ${roomId} successfully claimed!`);
          res.json({ message: `Room ${roomId} claimed successfully!` });
        });
      }, 100); // 100ms delay to widen the race condition window
    } else {
      console.log(`Room ${roomId} is already claimed.`);
      res.status(400).json({ error: "Room is already claimed" });
    }
  });
});

app.listen(port, () => {
  console.log(`Khali Class Dhundo backend listening at http://localhost:${port}`);
});
