const express = require('express');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
// const generalRoutes = require('./router/general.js');
const { books, users } = require('./router/booksdb.js'); // Import books and users database

dotenv.config();

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Middleware to authenticate and extract the username from JWT
const authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Access token is missing' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded.username;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

// Register a new user
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }
    if (users[username]) {
        return res.status(400).json({ message: 'User already exists' });
    }
    users[username] = { password };
    return res.status(201).json({ message: 'Customer successfully registered. Now you can login.' });
});

// Login a user
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }
    const user = users[username];
    if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid username or password' });
    }
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
    return res.status(200).json({ message: 'Login successful', token });
});

// Add or update a review
app.put('/review/:isbn', authenticateJWT, (req, res) => {
    const isbn = req.params.isbn;
    const review = req.body.review;
    if (!books[isbn]) {
        return res.status(404).json({ message: 'Book not found' });
    }
    if (!review) {
        return res.status(400).json({ message: 'Review content is required' });
    }
    const username = req.user; // Extracted from the JWT token
    books[isbn].reviews[username] = review; // Add or update review
    res.status(200).json({ message: 'Review added/updated successfully', reviews: books[isbn].reviews });
});

// Delete a review
app.delete('/review/:isbn', authenticateJWT, (req, res) => {
    const isbn = req.params.isbn;
    if (!books[isbn]) {
        return res.status(404).json({ message: 'Book not found' });
    }
    const username = req.user; // Extracted from JWT
    const bookReviews = books[isbn].reviews;
    if (!bookReviews[username]) {
        return res.status(404).json({ message: 'No review found for the logged-in user' });
    }
    delete bookReviews[username]; // Remove the review
    res.status(200).json({ message: 'Review deleted successfully', reviews: bookReviews });
});

// // Use general.js routes
// app.use('/general', generalRoutes);

// Task 10: Get all books using an async callback function
app.get('/books', async (req, res) => {
    try {
        const getAllBooks = () => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    if (books) resolve(books);
                    else reject('Books not found');
                }, 1000); // Simulate async delay
            });
        };
        const allBooks = await getAllBooks();
        res.status(200).json(allBooks);
    } catch (error) {
        res.status(500).json({ message: error });
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
