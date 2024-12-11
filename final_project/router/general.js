const express = require('express');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { books, users } = require('./booksdb.js');

dotenv.config();

const public_users = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

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

// POST route to register a new user
public_users.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    if (users[username]) {
        return res.status(400).json({ message: 'User already exists' });
    }

    users[username] = { password };
    return res.status(201).json({ message: 'Customer successfully registered. Now you can login' });
});

// POST route for login
public_users.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = users[username];
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    if (user.password !== password) {
        return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'Login successful', token });
});

// GET route to fetch all books
public_users.get('/', function (req, res) {
    res.status(200).json(books);
});

// GET route to fetch book details based on ISBN
public_users.get('/isbn/:isbn', function (req, res) {
    const isbn = req.params.isbn;
    const book = books[isbn];
    if (book) {
        res.status(200).json(book);
    } else {
        res.status(404).json({ message: 'Book not found' });
    }
});

// GET route to fetch books by author
public_users.get('/author/:author', function (req, res) {
    const author = req.params.author.toLowerCase();
    const matchingBooks = [];

    for (const isbn in books) {
        if (books[isbn].author.toLowerCase() === author) {
            matchingBooks.push({ isbn, ...books[isbn] });
        }
    }

    if (matchingBooks.length > 0) {
        res.status(200).json(matchingBooks);
    } else {
        res.status(404).json({ message: 'No books found for the given author' });
    }
});

// GET route to fetch books by title
public_users.get('/title/:title', function (req, res) {
    const title = req.params.title.toLowerCase();
    const matchingBooks = [];

    for (const isbn in books) {
        if (books[isbn].title.toLowerCase() === title) {
            matchingBooks.push({ isbn, ...books[isbn] });
        }
    }

    if (matchingBooks.length > 0) {
        res.status(200).json(matchingBooks);
    } else {
        res.status(404).json({ message: 'No books found for the given title' });
    }
});

// GET route to fetch book reviews by ISBN
public_users.get('/review/:isbn', function (req, res) {
    const isbn = req.params.isbn;
    const book = books[isbn];
    if (book && book.reviews) {
        res.status(200).json(book.reviews);
    } else if (book) {
        res.status(404).json({ message: 'No reviews available for this book' });
    } else {
        res.status(404).json({ message: 'Book not found' });
    }
});

// Add or modify a review for a book
public_users.put('/review/:isbn', authenticateJWT, (req, res) => {
    const isbn = req.params.isbn;
    const review = req.body.review;

    if (!books[isbn]) {
        return res.status(404).json({ message: 'Book not found' });
    }

    if (!review) {
        return res.status(400).json({ message: 'Review content is required' });
    }

    const username = req.user; // Extracted from the JWT token
    const book = books[isbn];

    // Add or update the review
    book.reviews[username] = review;

    res.status(200).json({ message: 'Review added/updated successfully', reviews: book.reviews });
});

// GET all books
public_users.get('/books', async (req, res) => {
  try {
      const allBooks = await getAllBooks(); // Replace this with how you're fetching books
      res.status(200).json(allBooks);
  } catch (error) {
      res.status(500).json({ message: 'Unable to fetch books', error: error.message });
  }
});

async function getAllBooks() {
  return new Promise((resolve) => {
      resolve(books); // Assuming `books` is your database or object
  });
}


// Get book details based on ISBN (Task 11 with Axios and Async/Await)
general.get('/books/isbn/:isbn', async (req, res) => {
  const isbn = req.params.isbn;
  try {
      const book = await new Promise((resolve, reject) => {
          if (books[isbn]) resolve(books[isbn]);
          else reject(new Error('Book not found'));
      });
      res.status(200).json(book);
  } catch (error) {
      res.status(404).json({ message: error.message });
  }
});

// Get book details using Promise
general.get('/books/isbn-promise/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  new Promise((resolve, reject) => {
      if (books[isbn]) resolve(books[isbn]);
      else reject(new Error('Book not found'));
  })
      .then((book) => res.status(200).json(book))
      .catch((error) => res.status(404).json({ message: error.message }));
});



module.exports.general = public_users;
