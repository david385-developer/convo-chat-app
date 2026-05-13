# Convo — Real-time Chat Platform

Convo is a production-grade, high-performance real-time communication platform built with the MERN stack (replacing Mongo with SQLite for extreme performance and simplicity).

## 🚀 Key Features

- **Real-time Messaging**: Powered by Socket.io with sub-12ms delivery.
- **Midnight Pulse Design**: A custom, premium dark-mode UI built from scratch with Vanilla CSS.
- **Presence & Status**: Real-time online/offline tracking and typing indicators.
- **Relational Integrity**: Normalized SQLite schema with better-sqlite3 for synchronous DB operations.
- **Smart Notifications**: Mention-based alerting and unread count synchronization.
- **Markdown Support**: Full Github-flavored markdown rendering in chat bubbles.
- **Responsive Layout**: Pixel-perfect experience across Desktop, Tablet, and Mobile.

## 🛠️ Tech Stack

- **Frontend**: React 18, Context API, React Router v6, Vanilla CSS.
- **Backend**: Node.js, Express, Socket.io.
- **Database**: SQLite (via better-sqlite3).
- **Authentication**: JWT (JSON Web Tokens) & bcryptjs.
- **File Handling**: Multer for avatar and media uploads.

## 📦 Project Structure

```text
convo/
├── client/              # React Frontend
│   ├── src/
│   │   ├── components/  # Reusable UI units
│   │   ├── context/     # Global state management
│   │   ├── hooks/       # Custom React logic
│   │   ├── styles/      # Design system (Midnight Pulse)
│   │   └── services/    # API & Socket factories
├── server/              # Node.js Backend
│   ├── controllers/     # Business logic
│   ├── database/        # SQLite init & migrations
│   ├── middleware/      # Auth & Validation
│   ├── models/          # Data Access Layer
│   ├── routes/          # API Endpoints
│   └── sockets/         # Modular Real-time handlers
└── uploads/             # Persistent media storage
```

## 🚦 Quick Start

### 1. Prerequisites
- Node.js >= 18
- npm >= 9

### 2. Installation
```bash
# Install root (backend) dependencies
npm install

# Install frontend dependencies
cd client
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
PORT=5000
JWT_SECRET=convo_secret_2024
DATABASE_PATH=./server/database/convo.db
CLIENT_URL=http://localhost:3000
```

### 4. Running Locally
```bash
# Start backend (from root)
npm run dev

# Start frontend (from client/)
npm start
```

## 🔒 Security

- **SQL Injection**: All queries are parameterized using `better-sqlite3`.
- **XSS Protection**: React's automatic escaping + input sanitization.
- **Auth**: JWT verification on every protected route and socket handshake.
- **Password Hashing**: Industry-standard bcryptjs with 10 salt rounds.

---
Built with 💜 for Convo.
