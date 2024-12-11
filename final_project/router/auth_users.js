const express = require('express');
const jwt = require('jsonwebtoken');
const { books } = require('./booksdb.js'); // Import books database
const dotenv = require('dotenv');

dotenv.config();

const regd_users = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to authenticate and extract the username from JWT
const authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Access token is missing' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded.username; // Attach the username to the request object
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

// DELETE route to remove a review
regd_users.delete('/review/:isbn', authenticateJWT, (req, res) => {
    const isbn = req.params.isbn;

    // Check if the book exists
    if (!books[isbn]) {
        return res.status(404).json({ message: 'Book not found' });
    }

    const username = req.user; // Extract username from the token
    const book = books[isbn];

    // Check if the user has a review
    if (!book.reviews[username]) {
        return res.status(404).json({ message: 'No review found for the logged-in user' });
    }

    // Delete the review
    delete book.reviews[username];

    res.status(200).json({ message: 'Review deleted successfully', reviews: book.reviews });
});

module.exports = regd_users;
