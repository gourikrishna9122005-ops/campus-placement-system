# PlaceTrack Campus Placement System

PlaceTrack is a comprehensive, full-stack campus recruitment platform designed to connect students with top companies. It streamlines the placement process by providing dedicated portals for both students and administrators.

## Features

### 🎓 Student Portal
- **Dashboard**: Overview of application stats, shortlists, and selections.
- **Browse Jobs**: Search and filter active job postings by branch, type, and eligibility.
- **Eligibility Checking**: Automated checks for CGPA, backlogs, and branch requirements before applying.
- **Application Tracking**: View the real-time status and remarks of all job applications.
- **Profile Management**: Update contact info, academic details, skills, and resume links.

### 🛡️ Admin Portal
- **Dashboard Overview**: Key metrics including total students, companies, active jobs, and placement rates.
- **Student Management**: View registered students and their academic details.
- **Company Management**: Add and manage recruiting companies.
- **Job Management**: Post new job openings with specific eligibility criteria (CGPA, backlogs, branches, etc.).
- **Application Processing**: Review student applications, update statuses (Applied, Shortlisted, Selected, Rejected), and add remarks.

## Tech Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript (Single Page Application structure in `index.html`). Beautiful, responsive UI using modern CSS variables and animations.
- **Backend**: Node.js & Express API (`placetrack-backend/`).
- **Database**: PostgreSQL (configured for Neon Serverless Postgres).
- **ORM**: Prisma for database schema management and queries.
- **Authentication**: JWT (JSON Web Tokens) and bcrypt for secure password hashing.

## Project Structure

```text
campus-placement-system/
├── index.html             # Main frontend application (UI & Client-side logic)
├── placetrack-backend/    # Node.js Express backend API
│   ├── prisma/            # Prisma schema and seed scripts
│   ├── src/               # Backend source code (routes, middleware, db setup)
│   ├── package.json       # Backend dependencies and scripts
│   └── .env               # Environment variables configuration
└── README.md              # This file
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- PostgreSQL database (e.g., [Neon.tech](https://neon.tech/))

### 1. Database & Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd placetrack-backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Ensure your `.env` file in the `placetrack-backend` folder has the following. (A template `.env` might already be present):
   ```env
   DATABASE_URL="your-postgresql-connection-string"
   PORT=3000
   JWT_SECRET="your-super-secret-jwt-key"
   ```
4. Initialize the database and seed initial admin data:
   ```bash
   npm run setup
   ```
   *(Note: This runs `npx prisma migrate dev --name init` and `node prisma/seed.js`)*

5. Start the backend server:
   ```bash
   npm run dev
   ```
   The backend should now be running on `http://localhost:3000`.

### 2. Frontend Setup

The frontend is a static HTML file that fetches data directly from the backend API.
Simply open `index.html` in any modern web browser to access the application. For local development, serving it using an extension like Live Server or a simple HTTP server (e.g. `npx serve .`) is recommended.

## Default Admin Credentials

If you seeded the database using the provided setup script, you can log in to the admin portal using:
- **Email**: `[EMAIL_ADDRESS]`
- **Password**: `[PASSWORD]`

*(Note: Verify these credentials in your `prisma/seed.js` if they have been updated.)*
Students can register for new accounts directly through the "Register Now" button on the landing page..
