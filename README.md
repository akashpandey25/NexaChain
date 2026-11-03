# NexaChain – Investment & Referral Management Platform

## 1. Project Overview

**NexaChain** is a professional, scalable, and maintainable full-stack application designed for investment management, multi-tier referral tracking, and automated ROI distribution.

This repository is structured as a monorepo containing decoupled backend and frontend codebases, following clean architecture and modular feature-based design principles.

---

## 2. Technology Stack

### Frontend
- **Runtime & Build Tool:** [Node.js](https://nodejs.org/) & [Vite](https://vitejs.dev/)
- **Core Library:** [React.js](https://react.dev/) (JavaScript)
- **State Management & Data Fetching:** [Redux Toolkit](https://redux-toolkit.js.org/) & [RTK Query](https://redux-toolkit.js.org/rtk-query/overview)
- **Routing:** [React Router DOM](https://reactrouter.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **HTTP Client:** [Axios](https://axios-http.com/) (reserved for custom/fallback network workflows)
- **Data Visualization:** [Recharts](https://recharts.org/)
- **Forms & Validation:** [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **Icons:** [Lucide React](https://lucide.dev/)

### Backend
- **Runtime:** [Node.js](https://nodejs.org/) (CommonJS)
- **Framework:** [Express.js](https://expressjs.com/)
- **Database & ODM:** [MongoDB](https://www.mongodb.com/) & [Mongoose](https://mongoosejs.com/)
- **Security & Logging:** [Helmet](https://helmetjs.github.io/), [CORS](https://github.com/expressjs/cors), [Morgan](https://github.com/expressjs/morgan)
- **Authentication & Encryption:** [JSON Web Token (JWT)](https://jwt.io/), [Bcryptjs](https://github.com/dcodeIO/bcrypt.js)
- **Scheduled Tasks:** [Node-Cron](https://github.com/node-cron/node-cron)
- **Validation:** [Zod](https://zod.dev/)
- **Testing & Tooling:** [Jest](https://jestjs.io/), [Supertest](https://github.com/ladjs/supertest), [mongodb-memory-server](https://github.com/nodkz/mongodb-memory-server), [Nodemon](https://nodemon.io/)

---

## 3. Folder Structure

```
nexachain-investment-platform/
│
├── backend/
│   ├── src/
│   │   ├── config/          # Database, environment, and 3rd-party service configs
│   │   ├── models/          # Mongoose data models
│   │   ├── controllers/     # Request handlers and response formatting
│   │   ├── routes/          # API route definitions
│   │   ├── middleware/      # Authentication, authorization, and error handlers
│   │   ├── services/        # Core business logic and calculations
│   │   ├── validators/      # Zod validation schemas
│   │   ├── cron/            # Scheduled jobs (daily ROI, referral settlements)
│   │   ├── utils/           # Helper functions and shared utilities
│   │   ├── tests/           # Integration and unit test suites
│   │   ├── app.js           # Express app setup and middleware configuration
│   │   └── server.js        # Server entry point and HTTP listener
│   │
│   ├── .env.example         # Backend environment variable template
│   ├── .gitignore           # Git ignore rules for backend
│   └── package.json         # Backend dependencies and scripts
│
├── frontend/
│   ├── src/
│   │   ├── app/             # Redux store setup and root RTK Query API slice
│   │   ├── features/        # Feature-based state slices and components
│   │   │   ├── auth/        # User authentication & registration
│   │   │   ├── dashboard/   # User and admin dashboards
│   │   │   ├── investments/ # Investment plan selection & management
│   │   │   ├── roi/         # ROI history and tracking
│   │   │   ├── referrals/   # Referral network tree & commission tracking
│   │   │   ├── wallet/      # Deposit, withdrawal, and balance management
│   │   │   └── ui/          # Shared modal, toast, and theme state
│   │   │
│   │   ├── components/      # Reusable atomic UI components (buttons, cards, inputs)
│   │   ├── pages/           # Page-level components mapped to routes
│   │   ├── layouts/         # Layout wrappers (Sidebar, Navbar, AuthLayout)
│   │   ├── routes/          # Application router configuration and protected routes
│   │   ├── hooks/           # Custom reusable React hooks
│   │   ├── utils/           # Formatting, date helpers, and constants
│   │   ├── assets/          # Static assets (images, icons, fonts)
│   │   ├── App.jsx          # Root component
│   │   ├── main.jsx         # React application mounting point
│   │   └── index.css        # Tailwind CSS imports and global styles
│   │
│   ├── .env.example         # Frontend environment variable template
│   ├── index.html           # HTML template
│   ├── postcss.config.js    # PostCSS configuration for Tailwind CSS
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   ├── vite.config.js       # Vite configuration
│   └── package.json         # Frontend dependencies and scripts
│
├── docs/                    # Architecture diagrams, specifications, and notes
├── postman/                 # Postman API collections and environments
├── .gitignore               # Root git ignore rules
├── README.md                # Project documentation
└── package.json             # Root workspace management scripts
```

---

## 4. Environment Configuration

### Backend Configuration (`backend/.env`)

Copy `backend/.env.example` to `backend/.env` and update values as needed:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/nexachain
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
CRON_TIMEZONE=Asia/Kolkata
```

### Frontend Configuration (`frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 5. Installation Instructions

### Prerequisites
- Node.js (v18.x or later recommended; currently tested on v22.x)
- npm (v9.x or later)

### Quick Setup

From the repository root:

```bash
# 1. Install root, backend, and frontend dependencies
npm run install:all

# Alternatively install individually:
npm install
npm install --prefix backend
npm install --prefix frontend
```

---

## 6. Development Commands

### Monorepo Root Commands
```bash
# Run both Backend and Frontend concurrently
npm run dev

# Run only Backend
npm run dev:backend

# Run only Frontend
npm run dev:frontend
```

### Backend Direct Commands (from `backend/`)
```bash
npm run dev    # Starts server with Nodemon on port 5000
npm start      # Starts server in production mode
npm test       # Executes Jest test suite
```

### Frontend Direct Commands (from `frontend/`)
```bash
npm run dev      # Starts Vite dev server on port 5173
npm run build    # Produces production build in dist/
npm run preview  # Previews production build locally
```

---

## 7. Current Implementation Status

| Milestone / Component | Status | Description |
|-----------------------|--------|-------------|
| **Project Architecture** | ✅ Completed | Monorepo structure established with `frontend`, `backend`, `docs`, and `postman`. |
| **Dependencies Configuration** | ✅ Completed | Fully specified and verified for backend and frontend. |
| **Tailwind CSS Setup** | ✅ Completed | Configured with PostCSS, Tailwind plugins, and Vite. |
| **Environment Configuration** | ✅ Completed | `.env.example` templates created and `.env` added to `.gitignore`. |
| **Server Infrastructure** | ✅ Initialized | Express app initialized with security headers, CORS, and health endpoint. |
| **Client Infrastructure** | ✅ Initialized | Vite React app initialized with feature directory architecture. |
| **Database & Models** | ⏳ Pending | Awaiting subsequent milestone instructions. |
| **Authentication & Security** | ⏳ Pending | Awaiting subsequent milestone instructions. |
| **Investment & Referral Logic** | ⏳ Pending | Awaiting subsequent milestone instructions. |
| **UI Views & Dashboards** | ⏳ Pending | Awaiting subsequent milestone instructions. |

