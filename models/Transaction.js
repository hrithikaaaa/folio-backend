const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
    },
    borrowerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    borrowDate: { type: String, required: true },
    expectedReturnDate: { type: String, required: true },
    actualReturnDate: { type: String, default: null },
    amountPaid: { type: Number, default: 0 },
    refundAmount: { type: Number, default: null },
    status: { type: String, enum: ['borrowed', 'returned'], default: 'borrowed' },
    // Razorpay fields
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
