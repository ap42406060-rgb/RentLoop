<<<<<<< HEAD
# RentLoop
=======
# RentLoop - Peer-to-Peer Rental Marketplace

> **"Rent what you need. Share what you have."**  
> A full-stack web application designed for renting high-value items (cameras, gaming consoles, camping gear, bikes, power tools) from trusted local owners.

---

## 🌟 Key Features Completed

### 1. 🔐 Authentication & Session Security
- **User Registration (`/api/auth/signup`)**: Full client & server validation with **bcryptjs** (12 rounds) salted hashing and duplicate email prevention.
- **User Login (`/api/auth/login`)**: Secure JWT token generation with expiration and persistent browser sessions (`localStorage`).
- **User Profile (`/api/auth/me`)**: Retrieves logged-in profile along with live statistics (active bookings count, published listings count).

### 2. 📦 Product Catalog & Dynamic Filtering
- **Full Catalog (`GET /api/products`)**: Displays high-value rental items across categories:
  - 📷 Cameras & Drones
  - 🎮 Gaming & Consoles
  - 🚲 Vehicles & Mountain Bikes
  - ⛺ Camping & Outdoors
  - 🔊 Audio & Event Equipment
  - 🛠️ Tools & DIY Kits
  - 💻 Electronics & Mini Projectors
- **Real-Time Search**: Instant multi-attribute search across title, description, location, and category tags.
- **Advanced Sorting**:
  - Most Popular
  - Highest Rated
  - Price: Low to High
  - Price: High to Low
  - Recently Added
- **Availability Filter**: One-click toggle for "Available Only".

### 3. 📅 Rental Booking System
- **Booking Modal**:
  - Interactive date pickers (Start Date, End Date) with past-date prevention.
  - Automatic rental duration calculation.
  - Transparent pricing breakdown: Daily Rate × Days + Refundable Security Deposit = Grand Total.
  - Automatic prefilling of logged-in user name and email.
- **Confirmed Booking Receipt**: Instant booking confirmation badge with generated Reference ID and pickup instructions.

### 4. 🚀 "+ List Your Item" (Owner Marketplace)
- Allows users to list their own unused gear for rent to earn income.
- Custom title, category dropdown, daily rental price (₹), security deposit, pickup location, and description.
- **Quick Image Presets**: 8 high-resolution 1-click presets for cameras, drones, PS5, mountain bikes, tents, speakers, drills, and projectors.
- Immediately publishes to the live catalog upon submission.

### 5. ⭐ Reviews & Community Ratings
- Product detail quick-view modal with customer feedback list.
- Star ratings (1 to 5 stars) and real feedback comments.
- Interactive **"Write a Review"** form allowing customers to leave ratings on any rental item.

### 6. 👤 User Dashboard Modals
- **📋 My Bookings**: View active, completed, and cancelled rentals with dates, total cost, and a **"Cancel Rental"** action.
- **📦 My Listings**: Manage your listed rental products with a 1-click **"Mark as Rented / Available"** toggle and a **"Delete Listing"** action.

### 7. 🛡️ Resilient Database Architecture
- **Dual-Mode Database Adapter (`server/db.js`)**:
  - Connects to **MySQL** when active, automatically creates all relational tables (`users`, `products`, `bookings`, `reviews`), and seeds starter items.
  - If MySQL is offline or undergoing local setup, it automatically falls back to an **in-memory/JSON storage engine**, ensuring **zero 500 crashes** during demo/evaluations!

---

## 🏗️ Tech Stack

- **Frontend**: React 19, Vite, Modern CSS3 with Responsive Grid/Flexbox, Custom Toast Notifications.
- **Backend**: Node.js, Express 5.3, MySQL2 (`mysql2/promise`), JWT (`jsonwebtoken`), Bcryptjs, CORS, Dotenv.
- **Database**: MySQL 8.x (with automated schema creation & fallback adapter).

---

## 📁 Project Structure

```
RentLoop/
├── package.json               # Root workspace scripts
├── README.md                  # Project documentation
├── client/                    # Frontend (React 19 + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx              # Header with logo, badges & tabs
│   │   │   ├── Hero.jsx                # Banner with instant search & chips
│   │   │   ├── Categories.jsx          # Interactive category pills
│   │   │   ├── ProductCard.jsx         # Card with rating, deposit, status
│   │   │   ├── RentModal.jsx           # Date picker & booking calculations
│   │   │   ├── ListItemModal.jsx       # + List an Item modal with presets
│   │   │   ├── ProductDetailModal.jsx  # Specs, reviews & rating form
│   │   │   ├── MyBookingsModal.jsx     # User bookings history & cancellation
│   │   │   ├── MyListingsModal.jsx     # Owner item management & availability
│   │   │   ├── AuthModal.jsx           # Login & Signup tabs
│   │   │   └── Toast.jsx               # Floating toast notifications
│   │   ├── App.jsx                     # Master state & view orchestration
│   │   ├── App.css                     # Comprehensive modern stylesheet
│   │   └── main.jsx                    # React entry point
│   ├── package.json
│   └── vite.config.js
└── server/                    # Backend (Node.js + Express)
    ├── database/
    │   ├── schema.sql         # SQL DDL script for all MySQL tables
    │   └── seedData.js        # Starter products & sample reviews
    ├── middleware/
    │   └── auth.js            # JWT verification & optional auth middleware
    ├── routes/
    │   ├── auth.js            # /api/auth (signup, login, me)
    │   ├── products.js        # /api/products (CRUD, search, my-listings)
    │   ├── bookings.js        # /api/bookings (create, user bookings, cancel)
    │   └── reviews.js         # /api/reviews (get reviews, post review)
    ├── db.js                  # MySQL pool & resilient fallback engine
    ├── server.js              # Express app setup and mount points
    ├── .env                   # Environment configuration
    └── package.json
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- MySQL Server (optional, recommended for production)

### 2. Configure Backend (`server/.env`)
Edit `server/.env` to match your local MySQL settings:
```env
PORT=5002
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=rentloop
JWT_SECRET=your_jwt_secret_key_here
```

*(Note: Port 5002 is configured by default because on macOS, Port 5000 & 5001 are reserved by system services like AirPlay Receiver. If MySQL is not running on your machine, RentLoop will automatically start in resilient local storage mode so you can demo all features immediately without setup errors!)*

### 3. Run Backend Server
In a terminal:
```bash
cd server
npm install
npm run dev
```
The backend starts at `http://localhost:5002`.

### 4. Run Frontend Client
In a second terminal:
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173` in your browser!

---

## 📡 REST API Summary

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/health` | Health check & DB connection status | No |
| `POST` | `/api/auth/signup` | Register new user | No |
| `POST` | `/api/auth/login` | Login user & return JWT token | No |
| `GET` | `/api/auth/me` | Get current user profile & counters | Yes (Bearer Token) |
| `GET` | `/api/products` | Get products (search, category, sort) | No |
| `GET` | `/api/products/:id` | Get single product + verified reviews | No |
| `POST` | `/api/products` | List new product for rent | Yes (Bearer Token) |
| `GET` | `/api/products/user/my-listings` | Get items listed by logged-in user | Yes (Bearer Token) |
| `PATCH` | `/api/products/:id/availability` | Toggle product available/rented | Yes (Bearer Token) |
| `DELETE` | `/api/products/:id` | Delete product listing | Yes (Bearer Token) |
| `POST` | `/api/bookings` | Create new rental reservation | Optional |
| `GET` | `/api/bookings/my-bookings` | Get user rental bookings | Optional / Token |
| `PATCH` | `/api/bookings/:id/cancel` | Cancel a booking | Optional / Token |
| `GET` | `/api/reviews/:productId` | Get reviews for a product | No |
| `POST` | `/api/reviews/:productId` | Submit star rating and review | Optional |

---

## 💾 Manual Database Import (Optional)
If you wish to import the schema directly into MySQL Workbench, phpMyAdmin, or terminal:
```bash
mysql -u root -p < server/database/schema.sql
```
>>>>>>> f970d2e (Initial RentLoop upload)
