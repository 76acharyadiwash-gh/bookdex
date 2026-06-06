const express  = require("express");
const cors     = require("cors");
const { Pool } = require("pg");
const bcrypt   = require("bcrypt");
const jwt      = require("jsonwebtoken");

const app  = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* ---------------- DB (PostgreSQL) ---------------- */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }  /* required by Render */
});

/* Create tables if they don't exist */
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id       SERIAL PRIMARY KEY,
      name     TEXT,
      email    TEXT UNIQUE,
      password TEXT
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS books (
      id          SERIAL PRIMARY KEY,
      title       TEXT,
      author      TEXT,
      genre       TEXT,
      description TEXT,
      pages       INTEGER,
      "currentPage" INTEGER,
      status      TEXT,
      rating      INTEGER,
      notes       TEXT,
      "startDate"   TEXT,
      "finishDate"  TEXT,
      "coverUrl"    TEXT,
      user_id     INTEGER
    )
  `);
  console.log("Database tables ready");
}
initDB().catch(err => console.error("DB init error:", err));

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
app.post("/api/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "All fields required" });

  try {
    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3)",
      [name, email, hashed]
    );
    res.json({ message: "Account created! Please log in." });
  } catch (err) {
    if (err.code === "23505")  /* unique violation */
      return res.status(409).json({ error: "Email already in use" });
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- LOGIN ---------------- */
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1", [email]
    );
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: "No account with that email" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Wrong password" });

    const token = jwt.sign(
      { id: user.id, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token, name: user.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- GET BOOKS ---------------- */
app.get("/api/books", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM books WHERE user_id = $1 ORDER BY id DESC",
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- ADD BOOK ---------------- */
app.post("/api/books", auth, async (req, res) => {
  const b = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO books
        (title, author, genre, description, pages, "currentPage",
         status, rating, notes, "startDate", "finishDate", "coverUrl", user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING id`,
      [
        b.title, b.author, b.genre, b.description, b.pages,
        b.currentPage, b.status, b.rating, b.notes,
        b.startDate, b.finishDate, b.coverUrl, req.user.id
      ]
    );
    res.json({ id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- UPDATE BOOK ---------------- */
app.put("/api/books/:id", auth, async (req, res) => {
  const b = req.body;
  try {
    await pool.query(
      `UPDATE books SET
        title=$1, author=$2, genre=$3, description=$4, pages=$5,
        "currentPage"=$6, status=$7, rating=$8, notes=$9,
        "startDate"=$10, "finishDate"=$11, "coverUrl"=$12
       WHERE id=$13 AND user_id=$14`,
      [
        b.title, b.author, b.genre, b.description, b.pages,
        b.currentPage, b.status, b.rating, b.notes,
        b.startDate, b.finishDate, b.coverUrl,
        req.params.id, req.user.id
      ]
    );
    res.json({ message: "updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- DELETE BOOK ---------------- */
app.delete("/api/books/:id", auth, async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM books WHERE id=$1 AND user_id=$2",
      [req.params.id, req.user.id]
    );
    res.json({ message: "deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------- START SERVER ---------------- */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});