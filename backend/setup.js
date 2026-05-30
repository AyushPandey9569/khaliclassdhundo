const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

const rooms = [
  { name: 'AI-101', block: 'AI Block', description: 'Next to Chai Adda', status: 'empty' },
  { name: 'AI-202', block: 'AI Block', description: 'Above Le broc (Warning: AC was recently turned off)', status: 'empty' },
  { name: 'A-301', block: 'A Block', description: 'Near Fusion cafe', status: 'empty' },
  { name: 'B-105', block: 'B Block', description: 'Close to Maggie Point', status: 'empty' },
  { name: 'C-204', block: 'C Block', description: 'Next to Chai Adda', status: 'empty' },
  { name: 'D-401', block: 'D Block', description: 'Close to Maggie Point', status: 'empty' },
  { name: 'AI-303', block: 'AI Block', description: 'Near Fusion cafe', status: 'empty' },
  { name: 'B-202', block: 'B Block', description: 'Above Le broc (Warning: AC was recently turned off)', status: 'empty' },
  { name: 'C-101', block: 'C Block', description: 'Next to Chai Adda', status: 'empty' },
  { name: 'A-102', block: 'A Block', description: 'Close to Maggie Point', status: 'empty' }
];

db.serialize(() => {
  db.run("DROP TABLE IF EXISTS rooms");
  db.run("CREATE TABLE rooms (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, block TEXT, description TEXT, status TEXT)");

  const stmt = db.prepare("INSERT INTO rooms (name, block, description, status) VALUES (?, ?, ?, ?)");
  rooms.forEach(room => {
    stmt.run(room.name, room.block, room.description, room.status);
  });
  stmt.finalize();

  console.log("Database initialized with 10 dummy rooms.");
});

db.close();
