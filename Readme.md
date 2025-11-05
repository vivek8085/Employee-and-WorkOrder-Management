# JIEF Internship project
---
[visit site](https://employee-and-workorder.onrender.com/)
---
use credentials for Admin:admin@gmail.com, Manager:manager@gmail.com ,Employee: employee1@gmail.com , password:123456(for all).
# Employee & Work Order Management

This repository contains a full-stack Factory ERP application for managing Employee and work orders. It includes a Node.js/Express backend with MongoDB and a Vite + React frontend. The system supports three user roles with different permissions: Admin, Manager, and Employee.

## Table of Contents

- About
- Key Features
  - Admin
  - Manager
  - Employee
- Architecture
- Getting Started
  - Prerequisites
  - Backend Setup
  - Frontend Setup
- Environment Variables
- API Overview
- Real-time Notifications
- Data Models
- Development Scripts
- Notes & Next Steps

## About

This ERP project is designed to help manufacturing teams create and manage work orders, assign managers and employees, track status and materials, and provide role-based access controls. It uses JWT for auth, MongoDB for persistence, and Socket.io for real-time updates.

## Key Features

Admin
- Create and manage employee accounts (admins create accounts using the registration endpoint).
- Create departments.
- Create global work orders and assign managers.
- View all work orders and employees across the factory.
- Delete employees.

Manager
- See work orders assigned to them.
- Assign single or multiple employees to a work order.
- Update work order status and materials (approve/complete/adjust cost).
- Receive real-time updates when work orders are created or updated.

Employee
- View work orders assigned to them (single assignment or included in a multi-assignment array).
- Update status and materials for work assigned to them.
- Receive real-time notifications for assigned work.

## Architecture

- Backend: Node.js, Express, MongoDB (Mongoose), Socket.io, JWT-based authentication
- Frontend: React (Vite), Tailwind/DaisyUI, Socket.io-client

Project folders:
- `backend/` — Express server, models, routes, middleware
- `frontend/` — React app, components, pages, API wrappers

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- MongoDB Atlas or local MongoDB instance

### Backend Setup

1. Open a terminal at `backend/`.
2. Install dependencies:

```powershell
cd backend; npm install
```

3. Create a `.env` file in `backend/` with the required environment variables (see below).
4. Start the backend server in development (uses `nodemon`):

```powershell
npm run start
```

The server listens on the port set in `PORT` (default 5000).

### Frontend Setup

1. Open a terminal at `frontend/`.
2. Install dependencies:

```powershell
cd frontend; npm install
```

3. Start the dev server:

```powershell
npm run dev
```

The Vite dev server will typically run on `http://localhost:5173` (or another free port).

## Environment Variables

Create a `.env` file in `backend/` with at least the following values:

- `MONGO_URI` - MongoDB connection string (Atlas or local)
- `JWT_SECRET` - Secret key used to sign JWT tokens
- `PORT` - (optional) port for the backend server, defaults to `5000`

Example `.env`:

```
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/factory-erp?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_key
PORT=5000
```

## API Overview

Base API path: `/api`

Auth
- POST `/api/auth/register` — Admin creates new users (requires role and department for managers/employees)
- POST `/api/auth/login` — Login with email & password; returns `{ token, user }`

Departments
- POST `/api/departments` — Create department (Admin only)
- GET `/api/departments` — List departments (Authenticated)

Employees
- GET `/api/employees` — List employees (Authenticated)
- DELETE `/api/employees/:id` — Delete employee (Admin only)

Work Orders
- POST `/api/workorders/admin` — Create work order (Admin only)
- PUT `/api/workorders/:id/assign-employee` — Assign single employee (Manager only)
- PUT `/api/workorders/:id/assign-employees` — Assign multiple employees (Manager only)
- PUT `/api/workorders/:id/status` — Update status/materials (Manager & Employee)
- GET `/api/workorders` — List all work orders (Admin only)
- GET `/api/workorders/manager` — Work orders for the logged-in manager (Manager only)
- GET `/api/workorders/employee` — Work orders for the logged-in employee (Employee only)

Authentication: All protected routes require an `Authorization: Bearer <token>` header.

## Real-time Notifications

The backend exposes a Socket.io server. When work orders are created or updated the server emits:
- `workorder_created` — Emitted after an admin creates a work order
- `workorder_updated` — Emitted after assignments or status updates

The frontend connects using `socket.io-client` and listens to these events to update UI in real-time.

## Data Models (high level)

Employee
- name, email, password (hashed), role (`admin|manager|employee`), department

Department
- name, description

WorkOrder
- product, description, department, assignedManager, assignedEmployee, assignedEmployees[], status, materials[], totalCost, createdBy, createdAt

## Development Scripts

Backend (in `backend/`):
- `npm run start` — Start server with `nodemon` (server.js)

Frontend (in `frontend/`):
- `npm run dev` — Start Vite dev server
- `npm run build` — Build production assets
- `npm run preview` — Preview production build

## Notes & Next Steps

- Registration endpoint expects Admins to create other users; consider adding a seeded admin account or a setup script.
- Add input validation and rate-limiting for production security hardening.
- Add unit/integration tests and CI pipelines.
- Consider role-based UI gating on the frontend to hide unauthorized actions.


---
