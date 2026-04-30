const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const authMiddleware = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Book = require('../models/Book');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Helper: days between two YYYY-MM-DD strings
const daysBetween = (from, to) => {
  const a = new Date(from);
  const b = new Date(to);
  return Math.ceil((b - a) / (1000 * 60 * 60 * 24));
};

const todayStr = () => new Date().toISOString().split('T')[0];

// ─── POST /api/payment/create-order ──────────────────────────────────────────
// Create a Razorpay order before borrowing
router.post('/create-order', authMiddleware, async (req, res) => {
  try {
    const { bookId, expectedReturnDate } = req.body;

    if (!bookId || !expectedReturnDate) {
      return res.status(400).json({ message: 'bookId and expectedReturnDate are required.' });
    }

    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: 'Book not found.' });
    if (!book.isAvailable) return res.status(400).json({ message: 'Book is not available.' });
    if (book.ownerId.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot borrow your own book.' });
    }

    const borrowDate = todayStr();
    const days = daysBetween(borrowDate, expectedReturnDate);
    if (days < 1) return res.status(400).json({ message: 'Return date must be at least 1 day from today.' });

    const amountPaid = days * book.pricePerDay;

    // Razorpay amount is in paise (1 INR = 100 paise)
    const order = await razorpay.orders.create({
      amount: amountPaid * 100,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        bookId: bookId,
        borrowerId: req.user._id.toString(),
        expectedReturnDate,
        borrowDate,
        days,
      },
    });

    res.json({
      orderId: order.id,
      amount: amountPaid,
      amountInPaise: amountPaid * 100,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      bookTitle: book.title,
      days,
      pricePerDay: book.pricePerDay,
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ message: 'Failed to create payment order.' });
  }
});

// ─── POST /api/payment/verify-and-borrow ─────────────────────────────────────
// Verify payment signature and create the transaction
router.post('/verify-and-borrow', authMiddleware, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookId,
      expectedReturnDate,
      amountPaid,
    } = req.body;

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
    }

    // Payment verified — create transaction
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: 'Book not found.' });
    if (!book.isAvailable) return res.status(400).json({ message: 'Book is no longer available.' });

    const borrowDate = todayStr();

    const transaction = await Transaction.create({
      bookId,
      borrowerId: req.user._id,
      borrowDate,
      expectedReturnDate,
      amountPaid,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      status: 'borrowed',
    });

    // Mark book unavailable
    book.isAvailable = false;
    await book.save();

    res.status(201).json({
      message: 'Payment successful! Book borrowed.',
      transaction,
      amountPaid,
    });
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ message: 'Payment verification failed.' });
  }
});

// ─── POST /api/payment/refund ─────────────────────────────────────────────────
// Process refund when book is returned early
router.post('/refund', authMiddleware, async (req, res) => {
  try {
    const { transactionId } = req.body;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found.' });
    if (transaction.borrowerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    if (transaction.status === 'returned') {
      return res.status(400).json({ message: 'Book already returned.' });
    }

    const book = await Book.findById(transaction.bookId);
    const actualReturnDate = todayStr();
    const expectedDays = daysBetween(transaction.borrowDate, transaction.expectedReturnDate);
    const actualDays = daysBetween(transaction.borrowDate, actualReturnDate);
    const pricePerDay = book ? book.pricePerDay : 0;

    // Positive = refund (early), Negative = extra charge (late)
    const refundAmount = (expectedDays - actualDays) * pricePerDay;

    // Process Razorpay refund if returned early and payment exists
    let razorpayRefund = null;
    if (refundAmount > 0 && transaction.razorpayPaymentId) {
      try {
        razorpayRefund = await razorpay.payments.refund(transaction.razorpayPaymentId, {
          amount: refundAmount * 100, // in paise
          notes: { reason: 'Early return refund', transactionId },
        });
      } catch (refundErr) {
        console.error('Razorpay refund error:', refundErr);
        // Continue even if Razorpay refund fails — update DB anyway
      }
    }

    // Update transaction
    transaction.actualReturnDate = actualReturnDate;
    transaction.refundAmount = refundAmount;
    transaction.status = 'returned';
    await transaction.save();

    // Mark book available
    if (book) {
      book.isAvailable = true;
      await book.save();
    }

    res.json({
      message: 'Book returned successfully!',
      transaction,
      refundAmount,
      actualReturnDate,
      razorpayRefund,
      extraCharge: refundAmount < 0 ? Math.abs(refundAmount) : 0,
    });
  } catch (err) {
    console.error('Refund error:', err);
    res.status(500).json({ message: 'Failed to process return.' });
  }
});

module.exports = router;
