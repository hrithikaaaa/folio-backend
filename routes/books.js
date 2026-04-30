const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const authMiddleware = require('../middleware/auth');

// ─── GET /api/books ───────────────────────────────────────────────────────────
// Public - get all books
router.get('/', async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    console.error('Get books error:', err);
    res.status(500).json({ message: 'Failed to fetch books.' });
  }
});

// ─── POST /api/books ──────────────────────────────────────────────────────────
// Protected - add a new book
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, author, pricePerDay } = req.body;

    if (!title || !author || !pricePerDay) {
      return res.status(400).json({ message: 'Title, author and pricePerDay are required.' });
    }
    if (Number(pricePerDay) <= 0) {
      return res.status(400).json({ message: 'Price per day must be greater than 0.' });
    }

    const book = await Book.create({
      title,
      author,
      pricePerDay: Number(pricePerDay),
      ownerId: req.user._id,
      isAvailable: true,
    });

    res.status(201).json(book);
  } catch (err) {
    console.error('Add book error:', err);
    res.status(500).json({ message: 'Failed to add book.' });
  }
});

module.exports = router;
