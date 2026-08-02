# Yatharth Gyan (यथार्थ ज्ञान) 🌿

> **Yatharth Gyan** is a holistic spiritual growth, self-realization, and daily practice platform that seamlessly integrates ancient Indian philosophical wisdom (Bhagavad Gita, Upanishads, Sadhana) with modern Artificial Intelligence.

---

## 🌟 Overview

Yatharth Gyan provides an interactive sanctuary for individuals seeking clarity, spiritual discipline, self-reflection, and personal growth. By combining intelligent AI wisdom synthesis with structured spiritual routines, users can build daily habits, track meditation & *sadhana*, explore ancient wisdom, and receive personalized life guidance.

---

## ✨ Key Features

- 🧘 **Sadhana (साधना)**: Track daily spiritual practices, meditation routines, chanting counters (*japa*), and habit consistency with intuitive progress analytics.
- 🤖 **AI Architect / Krishna AI Companion**: Engage with an AI guide powered by advanced LLMs to seek perspective, ask life questions, and receive scripture-grounded counsel.
- 👁️ **Drishti (दृष्टि)**: Set vision, align core values, and gain clarity on life goals and spiritual direction.
- 🧠 **Manan (मनन)**: Reflective journaling and introspective prompts to cultivate mindfulness and self-awareness.
- 📖 **Gyaan (ज्ञान)**: Curated wisdom repository for studying sacred texts, philosophical teachings, and timeless insights.
- 🔐 **Secure Authentication**: Seamless login experience via Google OAuth 2.0 or JWT-based credentials.

---

## 🛠️ Technology Stack

### **Frontend (`/dharma`)**
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS, PostCSS
- **Icons & UI**: Lucide React
- **Data Visualization**: Recharts
- **Authentication**: `@react-oauth/google`
- **HTTP Client**: Axios

### **Backend (`/server`)**
- **Runtime**: Node.js + Express 5
- **Database**: MongoDB with Mongoose ORM
- **Authentication**: JSON Web Tokens (JWT), `google-auth-library`, `bcryptjs`
- **AI Integration**: Groq Cloud API (Llama-3 models)
- **Deployment**: Vercel ready

---

## 📁 Repository Structure

```
yatharth_gyan/
├── dharma/                   # React 19 + Vite Frontend Client
│   ├── src/
│   │   ├── api/              # API Client & Endpoints
│   │   ├── components/       # Reusable UI Components
│   │   ├── context/          # State Management & Auth Context
│   │   ├── pages/            # Main Application Views (Sadhana, AIArchitect, Drishti, etc.)
│   │   └── data/             # Static Data & Scripture Content
│   ├── index.html
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                   # Node.js + Express API Backend
│   ├── middleware/           # Auth & Error Middlewares
│   ├── models/               # MongoDB Schemas (User, Habit, Sadhana, etc.)
│   ├── routes/               # API Routes
│   ├── server.js             # Express Application Entrypoint
│   └── vercel.json           # Vercel Serverless Configuration
│
└── README.md                 # Project Documentation
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas URI)

---

### 1. Server Setup (`/server`)

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:

```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=30d
CLIENT_ORIGIN=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id
GROQ_API_KEY=your_groq_api_key
```

Start the backend dev server:

```bash
npm run dev
```

The server will run on `http://localhost:5001`.

---

### 2. Frontend Setup (`/dharma`)

```bash
cd dharma
npm install
```

Create a `.env` file in the `dharma` directory:

```env
VITE_API_URL=http://localhost:5001/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Start the Vite development server:

```bash
npm run dev
```

The application will be accessible at `http://localhost:5173`.

---

## 🌐 Deployment

Both the frontend (`dharma`) and backend (`server`) include `vercel.json` configurations for seamless deployment on [Vercel](https://vercel.com).

---

## 📜 License

This project is licensed under the ISC License.
