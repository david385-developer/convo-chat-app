# Convo — Real-time Chat Platform 🚀

Convo is a high-performance, real-time communication platform built with a focus on speed, security, and premium user experience. It leverages the **"Midnight Pulse"** design system and a robust relational database architecture.

---

## 🛠️ Tech Stack

- **Frontend**: React 18 (Vite), Context API for state, Framer Motion for animations, Vanilla CSS.
- **Backend**: Node.js, Express, Socket.io (WebSocket) for real-time delivery.
- **Database**: SQLite via `better-sqlite3` (WAL mode enabled for high-concurrency).
- **Security**: JWT Authentication, Bcrypt password hashing, Helmet security headers, CORS protection.
- **Testing**: Jest & Supertest for unit and integration testing.

---

## 🏗️ Architecture Overview

The application follows a modular **Service-Controller-Model** pattern:

### Backend
- **Models**: Handles direct SQLite interaction with parameterized queries.
- **Controllers**: Contains business logic (e.g., room creation, message processing).
- **Sockets**: Modularized handlers for presence, messaging, and notifications.
- **Migrations**: Automated SQL-based schema evolution system.

### Frontend
- **Context Providers**: Centralized state for Auth, Chat, Sockets, and Notifications.
- **Service Layer**: Factory-based API and Socket services for consistent communication.
- **Responsive Components**: Tailored layouts for Desktop and Mobile (Bottom Sheets).

---

## 📂 Database Schema

The database is built on a highly normalized relational schema:

| Table | Description | Key Fields |
|-------|-------------|------------|
| **`users`** | Core user profiles and presence status. | `id`, `username`, `email`, `password_hash`, `status` |
| **`rooms`** | Public and private group chat channels. | `id`, `name`, `description`, `created_by` |
| **`room_members`** | Join table for room participants and roles. | `room_id`, `user_id`, `role` |
| **`conversations`** | Private 1-on-1 messaging tunnels. | `id`, `user1_id`, `user2_id` |
| **`messages`** | Unified message storage for rooms and DMs. | `id`, `sender_id`, `content`, `room_id`, `conversation_id` |
| **`notifications`** | Real-time alert tracking for mentions and DMs. | `id`, `user_id`, `type`, `is_read` |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **npm** (v9 or higher)

### 2. Installation
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Environment Configuration
Create a `.env` file in the `server` directory:
```env
PORT=5000
JWT_SECRET=your_secure_secret_here
DATABASE_PATH=./database/convo.db
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Create a `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 4. Database Initialization
You don't need to manually create the database. The system uses an **Automatic Migration Engine**:
- When you start the server, it checks the `server/database/migrations` directory.
- It automatically creates the SQLite file and runs all pending `.sql` files in order.

### 5. Running the App
```bash
# Run Backend (from /server)
npm run dev

# Run Frontend (from /client)
npm run dev
```

---

## 🧪 Testing
The project includes a comprehensive test suite using **Jest** and an **In-Memory SQLite** database for isolation.

```bash
cd server
npm test
```
*Tests cover: User registration, Login security, Room creation, and Real-time socket broadcasting.*

---

## 🌐 Production Deployment

### Backend (Render)
1. Set **Start Command**: `npm start`
2. Set **Build Command**: `npm install`
3. Add environment variables: `JWT_SECRET`, `CLIENT_URL` (your Vercel link), `NODE_ENV=production`.

### Frontend (Vercel)
1. Set **Framework Preset**: `Vite`
2. Add environment variables: `VITE_API_URL`, `VITE_SOCKET_URL` (your Render links).
3. The project includes a `vercel.json` to handle SPA routing correctly.

---
Built by **Convo Dev Team**. Professional, Fast, Secure.
