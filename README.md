# 💬 ChatNest — Premium Real-Time Messaging Space

ChatNest is a modern, responsive, real-time messaging application designed with premium glassmorphic aesthetics. Built using a robust monorepo architecture, it combines a React (Vite) single-page application frontend with an Express, MongoDB, and Socket.io backend.

It is structured to be production-ready and fully deployable to platforms like **Vercel** and **Render**.

---

## ✨ Features

- **⚡ Real-Time Chatting**: Instant message exchange via WebSockets (Socket.io).
- **🟢 Live Presence Indicators**: Track who is online and offline in real time.
- **💬 Typing Status**: Dynamic dot-pulsing indicator alerts you when your partner is typing.
- **📁 Custom Avatars**: Cloudinary-backed profile picture uploads with instant dashboard previews.
- **🛠️ Account Settings Control Room**: Update personal details (name, email) and secure passwords in a customized dashboard.
- **🎨 Glassmorphic Dark-Mode UI**: Implements Outfits typography, HSL color tokens, smooth micro-animations, and styled scrollbars.
- **📂 Tabbed Sidebar Panel**: Seamlessly toggle between your active "Chats" history and your searchable "Contacts" database.

---

## 🛠️ Tech Stack

**Frontend:**
- **React (Vite)** — Single-page application build.
- **Bootstrap 5 & Vanilla CSS** — Premium layout and styling overrides.
- **Socket.io Client** — Event-driven real-time connection.
- **Axios** — Promised-based API requests with auth interceptors.
- **React Icons (Fi)** — High-quality visual indicators.

**Backend:**
- **Node.js & Express.js** — REST API routing and controllers.
- **Socket.io** — WebSocket server handler.
- **Mongoose & MongoDB** — Schema validation and database storage.
- **Cloudinary SDK** — Direct stream uploads for user profile pictures.
- **JWT (JsonWebTokens)** — Secure authentication token exchange.
- **Multer** — In-memory middleware file buffer processing.

---

## 🚀 Quick Start (Local Setup)

To run the entire monorepo locally with a single terminal command:

1. **Clone the repository and enter the directory**:
   ```bash
   cd ChatNest
   ```

2. **Configure your Environment Variables**:
   - In `/backend/.env`, verify or add:
     ```env
     PORT=5000
     MONGO_URI=your_mongodb_connection_string
     JWT_SECRET=your_jwt_secret_key
     JWT_EXPIRE=7d
     CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
     CLOUDINARY_API_KEY=your_cloudinary_api_key
     CLOUDINARY_API_SECRET=your_cloudinary_api_secret
     ```
   - In `/frontend/.env`, verify or add:
     ```env
     VITE_API_URL=http://localhost:5000/api
     VITE_SOCKET_URL=http://localhost:5000
     ```

3. **Install all dependencies** (for root, frontend, and backend):
   ```bash
   npm run install:all
   ```

4. **Spin up local development servers concurrently**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` to test the application!

---

## ☁️ Deployment Instructions

### 1. Frontend (Vercel)
The Vite frontend compiles into static assets (`dist`) and is optimized for Vercel deployment:

1. Connect your GitHub repository to **Vercel**.
2. Create a new project and select the **`frontend`** folder as the root directory of the project.
3. Configure the build parameters:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build` or `vite build`
   - **Output Directory**: `dist`
4. Add the following **Environment Variables** in Vercel settings:
   - `VITE_API_URL`: Your live backend API URL (e.g. `https://chatnest-api.onrender.com/api`)
   - `VITE_SOCKET_URL`: Your live WebSocket server URL (e.g. `https://chatnest-api.onrender.com`)
5. Click **Deploy**!

### 2. Backend (Render / Railway — Recommended for WebSockets)
To support persistent real-time connections (WebSockets / Socket.io), the backend should be deployed to a stateful hosting platform like **Render**:

1. Create a new **Web Service** on Render.
2. Select your repository and point the root directory of the deployment to **`backend`**.
3. Configure build and start commands:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. In Render's **Environment** tab, upload the contents of your `/backend/.env` file:
   - `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRE`, and your `CLOUDINARY` credentials.
5. Click **Deploy Web Service**!

### 3. Backup: Backend REST API only (Vercel Serverless)
If you wish to deploy the backend REST API to Vercel, we have pre-configured a serverless entry point:
- **Wrapper**: `/backend/api/index.js`
- **Routing Rules**: `/backend/vercel.json`

> [!WARNING]
> Deploying the backend to Vercel will disable real-time WebSocket messaging (Socket.io) since Vercel Serverless functions run statelessly and time out. The application will function normally for authentication, profile updates, and database messages, and the chat UI will gracefully show a **"Socket Status: Offline"** badge in the header without crashing.

---

## 📁 Architecture Overview

```text
ChatNest/
│
├── backend/                   # Node/Express API & Sockets
│   ├── api/                   # Vercel serverless entry point
│   ├── config/                # Database & Cloudinary config
│   ├── controllers/           # Route logic (Auth, Users, Messages)
│   ├── middleware/            # JWT protect & Multer uploads
│   ├── models/                # MongoDB Schema (User, Message, Conv)
│   ├── routes/                # API endpoints mappings
│   ├── sockets/               # Real-time event emitters
│   ├── vercel.json            # Serverless deployment rules
│   └── server.js              # Local HTTP & socket server entry
│
├── frontend/                  # React/Vite Client
│   ├── src/
│   │   ├── components/        # ChatBox, Sidebar modules
│   │   ├── context/           # Auth and Socket global providers
│   │   ├── pages/             # Login, Register, Profile dashboards
│   │   ├── services/          # Axios wrappers (auth, chat, user)
│   │   ├── index.css          # Premium glassmorphic design system
│   │   └── main.jsx           # App render entry
│   └── vite.config.js         # Build system configuration
│
├── package.json               # Root monorepo runner
└── README.md                  # Detailed workspace overview
```
