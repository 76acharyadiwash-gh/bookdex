# 📖 BookDex

A personal book tracking web app to manage your reading life — track books you're reading, completed, plan to read, on hold, or dropped.

🌐 **Live Demo:** [bookdex.onrender.com](https://bookdex-2-cov3.onrender.com/)

---

## Features

- 🔐 User authentication (signup / login / logout)
- 📚 Add, edit, and delete books from your personal library
- 📊 Track reading progress with animated progress bars
- ⭐ Rate books out of 10
- 🗂️ Filter by status — Reading, Completed, Plan to Read, On Hold, Dropped
- 📈 Statistics page with genre breakdown and rating distribution
- 🔍 Search and sort your library
- 📱 Fully responsive — works on mobile and desktop

---

## Tech Stack

| Layer    | Technology          |
|----------|---------------------|
| Frontend | HTML, CSS, JavaScript (Vanilla) |
| Backend  | Node.js, Express.js |
| Database | PostgreSQL (hosted on Render) |
| Auth     | JWT (JSON Web Tokens) + bcrypt |
| Hosting  | Render.com |

---

## Run Locally

### 1. Clone the repo
```bash
git clone https://github.com/76acharyadiwash-gh/bookdex.git
cd bookdex
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create a `.env` file in the root folder
```
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_secret_key
```

### 4. Start the server
```bash
node server.js
```

### 5. Open in browser
```
http://localhost:3000
```

---

## Project Structure

```
bookdex/
├── public/
│   └── index.html      # Frontend (single page app)
├── server.js           # Express backend + API routes
├── package.json        # Dependencies
├── .env                # Environment variables (not committed)
└── .gitignore
```

---

## API Endpoints

| Method | Endpoint         | Description         | Auth Required |
|--------|-----------------|---------------------|---------------|
| POST   | /api/signup      | Create account      | No            |
| POST   | /api/login       | Login               | No            |
| GET    | /api/books       | Get all your books  | Yes           |
| POST   | /api/books       | Add a book          | Yes           |
| PUT    | /api/books/:id   | Update a book       | Yes           |
| DELETE | /api/books/:id   | Delete a book       | Yes           |

---

## Author

**Diwash Acharya**
- GitHub: [@76acharyadiwash-gh](https://github.com/76acharyadiwash-gh)

---

## License

This project is open source and available under the [MIT License](LICENSE).
