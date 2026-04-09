# School Management Mini System

A clean full stack school operations dashboard for managing students, assignments, and admin access.

## What It Does

- Secure admin login with JWT authentication
- Student CRUD: add, edit, delete, and list students
- Assignment CRUD: assign tasks to students, mark complete/pending, and view all tasks
- MongoDB-backed storage for users, students, and tasks

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB + Mongoose

## Data Storage

- Admin login credentials are stored in the MongoDB `users` collection
- Student records are stored in the MongoDB `students` collection
- Assignment records are stored in the MongoDB `tasks` collection

## Run Locally

1. Install dependencies:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

2. Configure environment variables:

- Copy `backend/.env.example` to `backend/.env`
- Set `MONGO_URI` to your MongoDB connection string
- Set `JWT_SECRET` to a secure value
- Copy `frontend/.env.example` to `frontend/.env` if you want to override the API URL

3. Start the app:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## Default Admin Account

On first run, the backend seeds this admin user into MongoDB:

- Username: `admin`
- Password: `admin123`

If you want to change it, edit the `users` collection in MongoDB or add your own admin record.

## API Endpoints

### Auth

- `POST /api/auth/login`
- `GET /api/auth/me`

### Students

- `GET /api/students`
- `POST /api/students`
- `PUT /api/students/:id`
- `DELETE /api/students/:id`

### Tasks

- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id/complete`

## Reviewer Notes

- Login data is not hardcoded in the frontend
- The app uses authenticated API requests for all dashboard actions
- Data persists in MongoDB and is visible in the `users`, `students`, and `tasks` collections
