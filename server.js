// Required Modules
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

// Create Express App
const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files
app.use(session({ secret: 'your-secret-key', resave: false, saveUninitialized: true }));

// Database Setup
const db = new sqlite3.Database('reading_tracker.db', (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to database');
        // Create users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        )`);

        // Create entries table
        db.run(`CREATE TABLE IF NOT EXISTS entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            bookTitle TEXT,
            pagesRead INTEGER,
            readingDate TEXT,
            FOREIGN KEY (userId) REFERENCES users (id)
        )`);
    }
});

// Serve Signup Page
app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Serve Login Page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html')); // Ensure you have the correct path
});

// User Registration
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function(err) {
            if (err) {
                return res.status(400).json({ message: 'Error creating user', success: false });
            }
            res.status(201).json({ message: 'User created successfully', success: true });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error', success: false });
    }
});

// User Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err || !row) {
            return res.status(400).json({ message: 'Invalid credentials', success: false });
        }
        bcrypt.compare(password, row.password, (err, result) => {
            if (result) {
                req.session.userId = row.id;
                res.json({ message: 'Login successful', success: true });
            } else {
                res.status(400).json({ message: 'Invalid credentials', success: false });
            }
        });
    });
});

// Track Pages
app.post('/track', (req, res) => {
    const { bookTitle, pagesRead, readingDate } = req.body;
    const userId = req.session.userId;

    if (!userId) {
        return res.status(403).json({ message: 'User not authenticated', success: false });
    }

    db.run('INSERT INTO entries (userId, bookTitle, pagesRead, readingDate) VALUES (?, ?, ?, ?)',
        [userId, bookTitle, pagesRead, readingDate], function(err) {
            if (err) {
                return res.status(400).json({ message: 'Error tracking pages', success: false });
            }
            res.json({ message: 'Pages tracked successfully', success: true });
        });
});

// Fetch Entries
app.get('/entries', (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.status(403).json({ success: false });
    }

    db.all('SELECT * FROM entries WHERE userId = ?', [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Error fetching entries', success: false });
        }
        res.json(rows);
    });
});

// Server Listen
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Logout User
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Could not log out', success: false });
        }
        res.json({ message: 'Logged out successfully', success: true });
    });
});

// Edit Entry
app.put('/edit/:id', (req, res) => {
    const entryId = req.params.id;
    const { bookTitle, pagesRead, readingDate } = req.body;
    db.run('UPDATE entries SET bookTitle = ?, pagesRead = ?, readingDate = ? WHERE id = ?',
        [bookTitle, pagesRead, readingDate, entryId], function(err) {
            if (err) {
                return res.status(400).json({ message: 'Error updating entry', success: false });
            }
            res.json({ message: 'Entry updated successfully', success: true });
        });
});

// Delete Entry
app.delete('/delete/:id', (req, res) => {
    const entryId = req.params.id;
    db.run('DELETE FROM entries WHERE id = ?', [entryId], function(err) {
        if (err) {
            return res.status(400).json({ message: 'Error deleting entry', success: false });
        }
        res.json({ message: 'Entry deleted successfully', success: true });
    });
});

