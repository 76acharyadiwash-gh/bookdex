const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");

const app = express();
const PORT = 3000;
const JWT_SECRET = "secret123";

app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

/* ---------------- DB ---------------- */
const db = new sqlite3.Database("./database/books.db");

/* USERS TABLE */
db.run(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT UNIQUE,
  password TEXT
)
`);

/* BOOKS TABLE */
db.run(`
CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  author TEXT,
  genre TEXT,
  description TEXT,
  pages INTEGER,
  currentPage INTEGER,
  status TEXT,
  rating INTEGER,
  notes TEXT,
  startDate TEXT,
  finishDate TEXT,
  coverUrl TEXT,
  user_id INTEGER NOT NULL
)
`);

/* ---------------- AUTH MIDDLEWARE ---------------- */
function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ message: "No token" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

/* ---------------- TEST ---------------- */
app.get("/api/test", (req, res) => {
  res.json({ message: "API works!" });
});

/* ---------------- SIGNUP ---------------- */
app.post("/api/signup", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "All fields required" });

  const hashedPassword = bcrypt.hashSync(password, 10);
  db.run(
    `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`,
    [name, email, hashedPassword],
    function (err) {
      if (err) return res.status(409).json({ error: "Email already in use" });
      res.json({ message: "Account created! Please log in." });
    }
  );
});

/* ---------------- LOGIN ---------------- */
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (!user) return res.status(401).json({ error: "No account with that email" });
    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return res.status(401).json({ error: "Wrong password" });

    /* FIX 6: JWT now expires in 7 days */
    const token = jwt.sign(
      { id: user.id, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token, name: user.name });
  });
});

/* ---------------- GET BOOKS (USER ONLY) ---------------- */
app.get("/api/books", auth, (req, res) => {
  db.all(
    "SELECT * FROM books WHERE user_id = ? ORDER BY id DESC",
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

/* ---------------- ADD BOOK ---------------- */
app.post("/api/books", auth, (req, res) => {
  const b = req.body;
  db.run(
    `INSERT INTO books (
      title, author, genre, description, pages,
      currentPage, status, rating, notes,
      startDate, finishDate, coverUrl, user_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      b.title, b.author, b.genre, b.description, b.pages,
      b.currentPage, b.status, b.rating, b.notes,
      b.startDate, b.finishDate, b.coverUrl, req.user.id
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

/* ---------------- UPDATE BOOK ---------------- */
app.put("/api/books/:id", auth, (req, res) => {
  const b = req.body;
  db.run(
    `UPDATE books SET
      title=?, author=?, genre=?, description=?, pages=?, currentPage=?,
      status=?, rating=?, notes=?, startDate=?, finishDate=?, coverUrl=?
     WHERE id=? AND user_id=?`,
    [
      b.title, b.author, b.genre, b.description, b.pages, b.currentPage,
      b.status, b.rating, b.notes, b.startDate, b.finishDate, b.coverUrl,
      req.params.id, req.user.id
    ],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "updated" });
    }
  );
});

/* ---------------- DELETE BOOK ---------------- */
app.delete("/api/books/:id", auth, (req, res) => {
  db.run(
    "DELETE FROM books WHERE id=? AND user_id=?",
    [req.params.id, req.user.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "deleted" });
    }
  );
});

/* ---------------- START SERVER ---------------- */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
