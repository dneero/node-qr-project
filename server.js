import express from "express";
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static("public"));

const db = new sqlite3.Database("./data.db");

// Init DB
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS qr_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    content TEXT,
    scans INTEGER DEFAULT 0
  )`);
});

// Redirect + tracking
app.get("/r/:code", (req, res) => {
  const { code } = req.params;
  db.get("SELECT * FROM qr_codes WHERE code = ?", [code], (err, row) => {
    if (!row) return res.send("QR not found");
    db.run("UPDATE qr_codes SET scans = scans + 1 WHERE code = ?", [code]);
    if (row.content.startsWith("http")) {
      res.redirect(row.content);
    } else {
      res.send(row.content);
    }
  });
});

// Create QR
app.post("/api/qr", (req, res) => {
  const { code, content } = req.body;
  db.run(
    "INSERT INTO qr_codes (code, content) VALUES (?, ?)",
    [code, content],
    err => {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.listen(3000, () => console.log("QR Manager running on port 3000"));