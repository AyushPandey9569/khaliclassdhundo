const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const port = 3000;
const db = new sqlite3.Database('./database.sqlite');

app.use(cors());
app.use(express.json());

// GET all rooms or filter by block and/or canteen
app.get('/api/rooms', (req, res) => {
  const block = req.query.block;
  const canteen = req.query.canteen;
  let query = "SELECT * FROM rooms";
  let conditions = [];
  let params = [];

  if (block && block !== 'All') {
    conditions.push("block = ?");
    params.push(block);
  }

  if (canteen && canteen !== 'All') {
    let keyword = '';
    const canteenLower = canteen.toLowerCase();
    if (canteenLower.includes('fusion')) keyword = '%fusion%';
    else if (canteenLower.includes('chai')) keyword = '%chai%';
    else if (canteenLower.includes('maggie')) keyword = '%maggie%';
    else if (canteenLower.includes('broc')) keyword = '%broc%';

    if (keyword) {
      conditions.push("description LIKE ?");
      params.push(keyword);
    }
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// POST claim a room - FIXED RACE CONDITION (ATOMIC WRITE)
app.post('/api/claim/:id', (req, res) => {
  const roomId = req.params.id;

  // Atomic update: only set status to claimed if it is empty
  db.run("UPDATE rooms SET status = 'claimed' WHERE id = ? AND status = 'empty'", [roomId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      // Either room doesn't exist or is already claimed.
      // Check database to provide exact error.
      db.get("SELECT status FROM rooms WHERE id = ?", [roomId], (dbErr, row) => {
        if (dbErr) {
          return res.status(500).json({ error: dbErr.message });
        }
        if (!row) {
          return res.status(404).json({ error: "Room not found" });
        }
        return res.status(400).json({ error: "Room is already claimed" });
      });
    } else {
      console.log(`Room ${roomId} successfully claimed!`);
      res.json({ message: `Room ${roomId} claimed successfully!` });
    }
  });
});

// POST release a room - Atomic update back to empty
app.post('/api/release/:id', (req, res) => {
  const roomId = req.params.id;

  db.run("UPDATE rooms SET status = 'empty' WHERE id = ? AND status = 'claimed'", [roomId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      db.get("SELECT status FROM rooms WHERE id = ?", [roomId], (dbErr, row) => {
        if (dbErr) {
          return res.status(500).json({ error: dbErr.message });
        }
        if (!row) {
          return res.status(404).json({ error: "Room not found" });
        }
        return res.status(400).json({ error: "Room is already unoccupied" });
      });
    } else {
      console.log(`Room ${roomId} successfully released!`);
      res.json({ message: `Room ${roomId} is now unoccupied!` });
    }
  });
});

app.listen(port, () => {
  console.log(`Khali Class Dhundo backend listening at http://localhost:${port}`);
});
