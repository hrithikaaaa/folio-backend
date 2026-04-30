# 📚 Folio — Book Rental Platform

A full-stack peer-to-peer book rental platform where users can lend and borrow books with secure Razorpay payment integration.

🌐 **Live Demo** → [https://folio-frontend-zeta.vercel.app](https://folio-frontend-zeta.vercel.app)

---

## 📸 Screenshots

> Register → Browse Books → Borrow with Payment → My Rentals → Return & Refund

---

## ✨ Features

- 🔐 User Registration & Login with JWT Authentication
- 📖 Browse all listed books with search and availability filter
- ➕ List your own books for others to borrow with a daily rental price
- 💳 Borrow books with secure Razorpay payment (UPI, Cards, NetBanking)
- 💰 Automatic refund for early returns via Razorpay Refund API
- ⚠️ Extra charge calculation for late returns
- 📋 My Rentals dashboard to track all borrow/return history
- 🔴 Overdue detection with visual alerts

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 | UI library |
| React Router v6 | Client-side routing |
| Axios | API calls |
| Tailwind CSS | Styling |
| Context API | Auth state management |
| Razorpay JS SDK | Payment checkout |

### Backend
| Technology | Purpose |
|---|---|
| Node.js | Runtime environment |
| Express.js | REST API framework |
| MongoDB Atlas | Cloud database |
| Mongoose | ODM for MongoDB |
| JWT | Authentication |
| bcryptjs | Password hashing |
| Razorpay SDK | Payment & refunds |

---

## 💡 How It Works

### Borrow Flow
```
Select Book → Pick Return Date → Pay via Razorpay → Book Borrowed ✅
```

### Return Flow
```
Click Return → Calculate Days Used → Auto Refund/Extra Charge → Book Available ✅
```

### Pricing Logic
| Scenario | Calculation |
|---|---|
| Borrow | Days × Price Per Day |
| Early Return | Refund = Unused Days × Price Per Day |
| Late Return | Extra = Extra Days × Price Per Day |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v16+
- MongoDB Atlas account
- Razorpay account

### Backend Setup
```bash
cd book-rental-backend
npm install
```

Create `.env` file:
```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/book-rental
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

Start server:
```bash
npm run dev
```

### Frontend Setup
```bash
cd book-rental
npm install
```

Create `.env` file:
```env
REACT_APP_API_URL=http://localhost:5000
```

Start app:
```bash
npm start
```

---

## 📁 Project Structure

```
book-rental-backend/
├── models/
│   ├── User.js
│   ├── Book.js
│   └── Transaction.js
├── routes/
│   ├── auth.js
│   ├── books.js
│   ├── transactions.js
│   └── payment.js
├── middleware/
│   └── auth.js
└── server.js

book-rental/
└── src/
    ├── api/
    ├── components/
    │   ├── BookCard.js
    │   ├── BorrowModal.js
    │   ├── TransactionCard.js
    │   ├── Navbar.js
    │   └── Toast.js
    ├── context/
    │   └── AuthContext.js
    └── pages/
        ├── LoginPage.js
        ├── RegisterPage.js
        ├── BookListPage.js
        ├── AddBookPage.js
        └── MyTransactionsPage.js
```

---

## 🔌 API Endpoints

### Auth
```
POST /api/auth/register   - Register new user
POST /api/auth/login      - Login and get JWT token
```

### Books
```
GET  /api/books           - Get all books
POST /api/books           - Add new book (protected)
```

### Transactions
```
GET  /api/transactions/user      - Get user's transactions (protected)
```

### Payment
```
POST /api/payment/create-order   - Create Razorpay order
POST /api/payment/verify-and-borrow - Verify payment & confirm borrow
POST /api/payment/refund         - Return book & process refund
```

---

## 🔐 Security

- Passwords hashed with **bcryptjs**
- **JWT tokens** for stateless authentication
- **Razorpay signature verification** (HMAC SHA256) to prevent fake payments
- Environment variables for all secrets
- CORS configured for specific origins

---

## 💳 Test Payment Details

```
Card Number : 4111 1111 1111 1111
Expiry      : Any future date (12/26)
CVV         : Any 3 digits (123)
UPI         : success@razorpay
```

---

## 🌐 Deployment

| Service | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |
| Payments | Razorpay |

---

## 👩‍💻 Author

**Hrithika**
- GitHub: [@hrithikaaaa](https://github.com/hrithikaaaa)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
