const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Book = require('../models/Book');
const authMiddleware = require('../middleware/auth');

// Helper: get today as YYYY-MM-DD
const todayStr = () => new Date().toISOString().split('T')[0];

// Helper: days between two YYYY-MM-DD strings
const daysBetween = (from, to) => {
  const a = new Date(from);
  const b = new Date(to);
  return Math.ceil((b - a) / (1000 * 60 * 60 * 24));
};

// ─── POST /api/transactions/borrow ───────────────────────────────────────────
router.post('/borrow', authMiddleware, async (req, res) => {
  try {
    const { bookId, expectedReturnDate } = req.body;

    if (!bookId || !expectedReturnDate) {
      return res.status(400).json({ message: 'bookId and expectedReturnDate are required.' });
    }

    // Check book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: 'Book not found.' });
    }

    // Check availability
    if (!book.isAvailable) {
      return res.status(400).json({ message: 'This book is currently not available.' });
    }

    // Prevent owner from borrowing their own book
    if (book.ownerId.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot borrow your own book.' });
    }

    const borrowDate = todayStr();
    const days = daysBetween(borrowDate, expectedReturnDate);

    if (days < 1) {
      return res.status(400).json({ message: 'Return date must be at least 1 day from today.' });
    }

    const amountPaid = days * book.pricePerDay;

    // Create transaction
    const transaction = await Transaction.create({
      bookId,
      borrowerId: req.user._id,
      borrowDate,
      expectedReturnDate,
      amountPaid,
      status: 'borrowed',
    });

    // Mark book as unavailable
    book.isAvailable = false;
    await book.save();

    res.status(201).json({
      message: 'Book borrowed successfully!',
      transaction,
      amountPaid,
    });
  } catch (err) {
    console.error('Borrow error:', err);
    res.status(500).json({ message: 'Failed to borrow book.' });
  }
});

// ─── POST /api/transactions/return ───────────────────────────────────────────
router.post('/return', authMiddleware, async (req, res) => {
  try {
    const { transactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({ message: 'transactionId is required.' });
    }

    // Find transaction
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found.' });
    }

    // Only the borrower can return
    if (transaction.borrowerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not authorized to return this book.' });
    }

    // Already returned?
    if (transaction.status === 'returned') {
      return res.status(400).json({ message: 'This book has already been returned.' });
    }

    const actualReturnDate = todayStr();
    const book = await Book.findById(transaction.bookId);

    // Calculate refund or extra charge
    const expectedDays = daysBetween(transaction.borrowDate, transaction.expectedReturnDate);
    const actualDays = daysBetween(transaction.borrowDate, actualReturnDate);
    const pricePerDay = book ? book.pricePerDay : 0;

    // Positive = refund (returned early), Negative = extra charge (returned late)
    const refundAmount = (expectedDays - actualDays) * pricePerDay;

    // Update transaction
    transaction.actualReturnDate = actualReturnDate;
    transaction.refundAmount = refundAmount;
    transaction.status = 'returned';
    await transaction.save();

    // Mark book as available again
    if (book) {
      book.isAvailable = true;
      await book.save();
    }

    res.json({
      message: 'Book returned successfully!',
      transaction,
      refundAmount,
      actualReturnDate,
    });
  } catch (err) {
    console.error('Return error:', err);
    res.status(500).json({ message: 'Failed to return book.' });
  }
});

// ─── GET /api/transactions/user ───────────────────────────────────────────────
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.find({ borrowerId: req.user._id })
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (err) {
    console.error('Get transactions error:', err);
    res.status(500).json({ message: 'Failed to fetch transactions.' });
  }
});

module.exports = router;
