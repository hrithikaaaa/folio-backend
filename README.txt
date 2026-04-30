# Folio Backend API

## Setup

1. Install dependencies:
   npm install

2. Edit the .env file with your MongoDB URI

3. Start the server:
   npm run dev    (development with auto-restart)
   npm start      (production)

## MongoDB Options

### Option A - MongoDB Atlas (Free Cloud, Recommended)
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create a free account
3. Create a free M0 cluster
4. Click Connect → Drivers → copy the connection string
5. Paste it in .env as MONGO_URI=mongodb+srv://...

### Option B - Local MongoDB
1. Download from https://www.mongodb.com/try/download/community
2. Install and start MongoDB service
3. Use MONGO_URI=mongodb://localhost:27017/book-rental

## API Endpoints

POST   /api/auth/register
POST   /api/auth/login
GET    /api/books
POST   /api/books              (protected)
POST   /api/transactions/borrow  (protected)
POST   /api/transactions/return  (protected)
GET    /api/transactions/user    (protected)
